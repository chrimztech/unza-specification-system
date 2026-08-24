package zm.unza.cict.specification;

import org.junit.jupiter.api.Test;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.hr.HrStaff;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequestLifecycleIntegrationTest extends AbstractIntegrationTest {

    @Test
    void requestWithoutAHelpDeskReferenceIsRejected() throws Exception {
        HrStaff staff = freshStaff("no-ref");
        String token = loginAs(staff);

        mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"title":"Missing reference"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateHelpDeskReferenceIsRejected() throws Exception {
        HrStaff staff = freshStaff("dup-ref");
        String token = loginAs(staff);
        String reference = "HD-TEST-" + System.nanoTime();

        mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"reference\":\"%s\",\"title\":\"First\"}".formatted(reference)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"reference\":\"%s\",\"title\":\"Second\"}".formatted(reference)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aNegativeItemQuantityIsRejectedByValidation() throws Exception {
        HrStaff staff = freshStaff("bad-qty");
        String token = loginAs(staff);
        String categoryId = anyEquipmentCategoryId(token);

        mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"reference":"HD-QTY-%d","title":"Bad quantity","items":[
                                  {"categoryId":"%s","quantity":-1,"purpose":"test"}
                                ]}
                                """.formatted(System.nanoTime(), categoryId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['items[0].quantity']").exists());
    }

    @Test
    void fullApprovalLifecycleReachesApproved() throws Exception {
        HrStaff staff = freshStaff("lifecycle");
        String token = loginAs(staff);
        String categoryId = anyEquipmentCategoryId(token);
        grantRole(staff.email(), AppRole.CICT_REVIEWER);

        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"reference\":\"HD-LIFECYCLE-%d\",\"title\":\"Lifecycle test\"}"
                                .formatted(System.nanoTime())))
                .andExpect(status().isOk())
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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending_manager"));

        mockMvc.perform(post("/api/requests/" + id + "/manager-decision")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"decision":"approved"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending_cict"));

        mockMvc.perform(post("/api/requests/" + id + "/cict-decision")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"decision":"approved"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));
    }

    @Test
    void aNonCictUserCannotApproveTechnicalReview() throws Exception {
        HrStaff staff = freshStaff("no-cict");
        String token = loginAs(staff);
        String categoryId = anyEquipmentCategoryId(token);

        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"reference\":\"HD-NOCICT-%d\",\"title\":\"No CICT role\"}"
                                .formatted(System.nanoTime())))
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
                .andExpect(status().isForbidden());
    }
}
