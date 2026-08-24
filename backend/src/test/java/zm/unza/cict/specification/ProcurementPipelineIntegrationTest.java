package zm.unza.cict.specification;

import org.junit.jupiter.api.Test;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.hr.HrStaff;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Walks a request through the full post-approval pipeline (quotations -> evaluation -> purchase
 * -> stores -> verification), using a single ADMIN-role account to stand in for every pipeline
 * role — matching the bypass ProcurementService already grants admins, so this exercises the
 * same code paths procurement/stores/cict_support accounts would hit.
 */
class ProcurementPipelineIntegrationTest extends AbstractIntegrationTest {

    /** Creates, submits and fully approves a request (self as manager), returning its id. */
    private String approvedRequestId(String token, String categoryId, String reference) throws Exception {
        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"reference\":\"%s\",\"title\":\"Pipeline test\"}".formatted(reference)))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        String userId = objectMapper.readTree(created).get("requester").get("id").asText();

        mockMvc.perform(put("/api/requests/" + id + "?submit=true")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"justification":"Because I need it","requestType":"New requirement",
                                 "businessContext":"Administration","managerId":"%s",
                                 "declarationAccepted":true,
                                 "items":[{"categoryId":"%s","quantity":1,"purpose":"testing"}]}
                                """.formatted(userId, categoryId)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/manager-decision")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"decision\":\"approved\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/cict-decision")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"decision\":\"approved\"}"))
                .andExpect(status().isOk());

        return id;
    }

    private String addQuotation(String token, String id, String vendor, int amount) throws Exception {
        String quotation = mockMvc.perform(post("/api/requests/" + id + "/quotations")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"vendorName\":\"%s\",\"amount\":%d}".formatted(vendor, amount)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(quotation).get("id").asText();
    }

    @Test
    void happyPathReachesCompletedWithSequentialReferences() throws Exception {
        HrStaff staff = freshStaff("procurement-happy");
        String token = loginAs(staff);
        grantRole(staff.email(), AppRole.ADMIN);
        String categoryId = anyEquipmentCategoryId(token);

        String id = approvedRequestId(token, categoryId, "HD-HAPPY-" + System.nanoTime());
        String quotationId = addQuotation(token, id, "Acme", 1000);

        mockMvc.perform(post("/api/requests/" + id + "/quotations/" + quotationId + "/evaluate")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value(org.hamcrest.Matchers.startsWith("UNZA/CICT/EVAL/")));

        mockMvc.perform(post("/api/requests/" + id + "/purchase")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"quotationId\":\"%s\",\"vendorName\":\"Acme\",\"amount\":1000}".formatted(quotationId)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/stores-receipt")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/verification")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value(org.hamcrest.Matchers.startsWith("UNZA/CICT/VERIFY/")));

        mockMvc.perform(get("/api/requests/" + id).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.status").value("completed"));
    }

    @Test
    void failingEvaluationWithoutAReasonIsRejected() throws Exception {
        HrStaff staff = freshStaff("procurement-noreason");
        String token = loginAs(staff);
        grantRole(staff.email(), AppRole.ADMIN);
        String categoryId = anyEquipmentCategoryId(token);

        String id = approvedRequestId(token, categoryId, "HD-NOREASON-" + System.nanoTime());
        String quotationId = addQuotation(token, id, "Acme", 1000);

        mockMvc.perform(post("/api/requests/" + id + "/quotations/" + quotationId + "/evaluate")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"fail\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void purchasingAFailedQuotationIsRejected() throws Exception {
        HrStaff staff = freshStaff("procurement-failpurchase");
        String token = loginAs(staff);
        grantRole(staff.email(), AppRole.ADMIN);
        String categoryId = anyEquipmentCategoryId(token);

        String id = approvedRequestId(token, categoryId, "HD-FAILPURCHASE-" + System.nanoTime());
        String quotationId = addQuotation(token, id, "BadVendor", 1000);

        mockMvc.perform(post("/api/requests/" + id + "/quotations/" + quotationId + "/evaluate")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"fail\",\"notes\":\"Below spec\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/purchase")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"quotationId\":\"%s\",\"vendorName\":\"BadVendor\",\"amount\":1000}".formatted(quotationId)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void needsReturnLoopsBackToProcurementViaRestart() throws Exception {
        HrStaff staff = freshStaff("procurement-return");
        String token = loginAs(staff);
        grantRole(staff.email(), AppRole.ADMIN);
        String categoryId = anyEquipmentCategoryId(token);

        String id = approvedRequestId(token, categoryId, "HD-RETURN-" + System.nanoTime());
        String quotationId = addQuotation(token, id, "Acme", 1000);

        mockMvc.perform(post("/api/requests/" + id + "/quotations/" + quotationId + "/evaluate")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"pass\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/purchase")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"quotationId\":\"%s\",\"vendorName\":\"Acme\",\"amount\":1000}".formatted(quotationId)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/stores-receipt")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isOk());

        // needs_return without a reason is rejected
        mockMvc.perform(post("/api/requests/" + id + "/verification")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"needs_return\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/requests/" + id + "/verification")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"result\":\"needs_return\",\"notes\":\"Wrong screen size\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests/" + id + "/restart-procurement")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/requests/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("procurement"));
    }
}
