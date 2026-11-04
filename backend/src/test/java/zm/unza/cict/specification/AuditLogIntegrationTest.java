package zm.unza.cict.specification;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.hr.HrStaff;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The audit trail records who did what from where, can be searched, and cannot be altered. */
class AuditLogIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void signInsSuccessfulAndFailedAreRecordedWithoutThePassword() throws Exception {
        HrStaff auditor = freshStaff("audit-signin-auditor");
        String auditorToken = loginAs(auditor);
        grantRole(auditor.email(), AppRole.AUDITOR);

        String stranger = "audit-nobody-" + System.nanoTime() + "@unza.zm";
        when(hrClient.authenticate(stranger, "wrong-secret")).thenThrow(new BadCredentialsException("Invalid credentials"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"identifier\":\"%s\",\"password\":\"wrong-secret\"}".formatted(stranger)))
                .andExpect(status().isUnauthorized());

        JsonNode failed = search(auditorToken, "actor=" + stranger);
        assertEquals(1, failed.get("total").asInt());
        JsonNode entry = failed.get("items").get(0);
        assertEquals("sign_in_failed", entry.get("action").asText());
        assertTrue(entry.hasNonNull("ipAddress"), "the client address is recorded");
        assertTrue(!entry.toString().contains("wrong-secret"), "the password is never stored");

        JsonNode ok = search(auditorToken, "actor=" + auditor.email() + "&action=sign_in");
        assertEquals(1, ok.get("total").asInt());
        assertEquals("Test audit-signin-auditor", ok.get("items").get(0).get("actorName").asText(),
                "the actor's full name is recorded with the entry");
    }

    @Test
    void workflowStepsAppearAndCanBeFilteredByCategory() throws Exception {
        HrStaff auditor = freshStaff("audit-flow-auditor");
        HrStaff requester = freshStaff("audit-flow-requester");
        String auditorToken = loginAs(auditor);
        String requesterToken = loginAs(requester);
        grantRole(auditor.email(), AppRole.AUDITOR);

        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(requesterToken))
                        .contentType("application/json")
                        .content("{\"title\":\"Audited request\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        mockMvc.perform(post("/api/requests/" + id + "/withdraw").header("Authorization", bearer(requesterToken)));

        JsonNode requestEntries = search(auditorToken, "entityType=Request&actor=" + requester.email());
        assertTrue(requestEntries.get("total").asInt() >= 1, "workflow steps are in the audit trail");
        for (JsonNode e : requestEntries.get("items")) {
            assertEquals("Request", e.get("entityType").asText());
        }

        JsonNode types = objectMapper.readTree(mockMvc.perform(get("/api/audit-log/entity-types")
                        .header("Authorization", bearer(auditorToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertTrue(types.toString().contains("\"Auth\""));
    }

    @Test
    void onlyAuditorsAndAdminsCanReadItAndNobodyCanClearIt() throws Exception {
        HrStaff staff = freshStaff("audit-access-staff");
        HrStaff admin = freshStaff("audit-access-admin");
        String staffToken = loginAs(staff);
        String adminToken = loginAs(admin);
        grantRole(admin.email(), AppRole.ADMIN);

        mockMvc.perform(get("/api/audit-log").header("Authorization", bearer(staffToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/audit-log").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        // The old "clear audit log" endpoint is gone.
        mockMvc.perform(delete("/api/audit-log").header("Authorization", bearer(adminToken)))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void anyUserCanRecordPrintingAnOfficialDocument() throws Exception {
        HrStaff staff = freshStaff("audit-print-staff");
        HrStaff auditor = freshStaff("audit-print-auditor");
        String staffToken = loginAs(staff);
        String auditorToken = loginAs(auditor);
        grantRole(auditor.email(), AppRole.AUDITOR);

        mockMvc.perform(post("/api/audit-log/document-export")
                        .header("Authorization", bearer(staffToken))
                        .contentType("application/json")
                        .content("{\"document\":\"Purchase order\",\"reference\":\"UNZA/CICT/REQ/TEST\"}"))
                .andExpect(status().isOk());

        JsonNode printed = search(auditorToken, "actor=" + staff.email() + "&action=document_printed");
        assertEquals(1, printed.get("total").asInt());
        assertEquals("Purchase order · UNZA/CICT/REQ/TEST", printed.get("items").get(0).get("details").asText());
    }

    @Test
    void theDatabaseRefusesToEditOrDeleteEntries() {
        jdbc.update("INSERT INTO audit_log (entity_type, action, details) VALUES ('Test', 'tamper_check', 'original')");
        assertThrows(Exception.class,
                () -> jdbc.update("UPDATE audit_log SET details = 'altered' WHERE action = 'tamper_check'"));
        assertThrows(Exception.class,
                () -> jdbc.update("DELETE FROM audit_log WHERE action = 'tamper_check'"));
        assertThrows(Exception.class, () -> jdbc.execute("TRUNCATE audit_log"));
        assertEquals("original", jdbc.queryForObject(
                "SELECT details FROM audit_log WHERE action = 'tamper_check'", String.class));
    }

    private JsonNode search(String token, String query) throws Exception {
        return objectMapper.readTree(mockMvc.perform(get("/api/audit-log?" + query)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
    }
}
