package zm.unza.cict.specification;

import org.junit.jupiter.api.Test;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.hr.HrStaff;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequestLifecycleIntegrationTest extends AbstractIntegrationTest {

    @Test
    void referenceIsGeneratedAutomaticallyAndIsUniquePerRequest() throws Exception {
        HrStaff staff = freshStaff("auto-ref");
        String token = loginAs(staff);

        String first = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"title":"First"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String second = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"title":"Second"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String firstReference = objectMapper.readTree(first).get("reference").asText();
        String secondReference = objectMapper.readTree(second).get("reference").asText();
        assertThat(firstReference).isNotBlank().matches("\\d{12}");
        assertThat(secondReference).isNotBlank().isNotEqualTo(firstReference);
        assertThat(objectMapper.readTree(first).get("requester").get("email").asText())
                .isEqualTo(staff.email());
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
                                {"title":"Bad quantity","items":[
                                  {"categoryId":"%s","quantity":-1,"purpose":"test"}
                                ]}
                                """.formatted(categoryId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['items[0].quantity']").exists());
    }

    @Test
    void fullApprovalLifecycleReachesApproved() throws Exception {
        HrStaff staff = freshStaff("lifecycle");
        String token = loginAs(staff);
        String categoryId = anyEquipmentCategoryId(token);
        String orgUnitId = anyOrgUnitId(token);
        grantRole(staff.email(), AppRole.CICT_REVIEWER);

        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"title\":\"Lifecycle test\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        String userId = objectMapper.readTree(created).get("requester").get("id").asText();

        mockMvc.perform(put("/api/requests/" + id + "?submit=true")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"orgUnitId":"%s","department":"Dean's office","designation":"Officer",
                                 "justification":"Because I need it","requestType":"New requirement",
                                 "businessContext":"Administration","managerId":"%s",
                                 "declarationAccepted":true,
                                 "items":[{"categoryId":"%s","quantity":1,"purpose":"testing"}]}
                                """.formatted(orgUnitId, userId, categoryId)))
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
        String orgUnitId = anyOrgUnitId(token);

        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"title\":\"No CICT role\"}"))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        String userId = objectMapper.readTree(created).get("requester").get("id").asText();

        mockMvc.perform(put("/api/requests/" + id + "?submit=true")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"orgUnitId":"%s","department":"Dean's office","designation":"Officer",
                                 "justification":"Because I need it","requestType":"New requirement",
                                 "businessContext":"Administration","managerId":"%s",
                                 "declarationAccepted":true,
                                 "items":[{"categoryId":"%s","quantity":1,"purpose":"testing"}]}
                                """.formatted(orgUnitId, userId, categoryId)))
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
