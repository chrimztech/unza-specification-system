package zm.unza.cict.specification;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.hr.HrStaff;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Notifications go to the people who must act next (manager or delegate, then CICT, then the
 * requester), never to the person who triggered the change, and only their owner can touch them.
 */
class NotificationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void eachStageNotifiesTheNextPersonButNeverTheActor() throws Exception {
        HrStaff requester = freshStaff("notify-requester");
        HrStaff manager = freshStaff("notify-manager");
        HrStaff cict = freshStaff("notify-cict");
        String requesterToken = loginAs(requester);
        String managerToken = loginAs(manager);
        String cictToken = loginAs(cict);
        grantRole(cict.email(), AppRole.CICT_REVIEWER);

        String id = createAndSubmit(requesterToken, userId(manager));

        // Submitted -> only the manager hears about it.
        assertEquals(List.of("pending manager"), statusesNotified(managerToken, id));
        assertEquals(List.of(), statusesNotified(requesterToken, id));
        assertEquals(List.of(), statusesNotified(cictToken, id));

        decide(managerToken, id, "manager-decision", "approved", "pending_cict");
        // Manager approved -> CICT is told; the manager (the actor) gets nothing new.
        assertEquals(List.of("pending cict"), statusesNotified(cictToken, id));
        assertEquals(List.of("pending manager"), statusesNotified(managerToken, id));
        assertEquals(List.of(), statusesNotified(requesterToken, id));

        decide(cictToken, id, "cict-decision", "approved", "approved");
        // CICT approved -> the requester is told the outcome; CICT (the actor) gets nothing new.
        assertEquals(List.of("approved"), statusesNotified(requesterToken, id));
        assertEquals(List.of("pending cict"), statusesNotified(cictToken, id));
    }

    @Test
    void clarificationAndRejectionAreSentBackToTheRequester() throws Exception {
        HrStaff requester = freshStaff("notify-clarify-requester");
        HrStaff manager = freshStaff("notify-clarify-manager");
        HrStaff cict = freshStaff("notify-clarify-cict");
        String requesterToken = loginAs(requester);
        String managerToken = loginAs(manager);
        String cictToken = loginAs(cict);
        grantRole(cict.email(), AppRole.CICT_REVIEWER);

        String id = createAndSubmit(requesterToken, userId(manager));
        decide(managerToken, id, "manager-decision", "approved", "pending_cict");
        decide(cictToken, id, "cict-decision", "needs_clarification", "needs_clarification");
        assertEquals(List.of("needs clarification"), statusesNotified(requesterToken, id));

        mockMvc.perform(post("/api/requests/" + id + "/respond-clarification")
                        .header("Authorization", bearer(requesterToken))
                        .contentType("application/json")
                        .content("{\"action\":\"clarification_response\",\"comment\":\"Main building\"}"))
                .andExpect(status().isOk());
        // Back with CICT, who are notified a second time.
        assertEquals(List.of("pending cict", "pending cict"), statusesNotified(cictToken, id));

        decide(cictToken, id, "cict-decision", "rejected", "rejected");
        assertEquals(List.of("rejected", "needs clarification"), statusesNotified(requesterToken, id));
    }

    @Test
    void anActiveDelegateIsNotifiedAndCanApproveForTheManager() throws Exception {
        HrStaff requester = freshStaff("notify-deleg-requester");
        HrStaff manager = freshStaff("notify-deleg-manager");
        HrStaff delegate = freshStaff("notify-deleg-delegate");
        String requesterToken = loginAs(requester);
        String managerToken = loginAs(manager);
        String delegateToken = loginAs(delegate);

        mockMvc.perform(post("/api/delegations")
                        .header("Authorization", bearer(managerToken))
                        .contentType("application/json")
                        .content("{\"delegateId\":\"%s\",\"reason\":\"On leave\"}".formatted(userId(delegate))))
                .andExpect(status().isOk());

        String id = createAndSubmit(requesterToken, userId(manager));
        assertEquals(List.of("pending manager"), statusesNotified(managerToken, id));
        assertEquals(List.of("pending manager"), statusesNotified(delegateToken, id));

        decide(delegateToken, id, "manager-decision", "approved", "pending_cict");
    }

    @Test
    void onlyTheOwnerCanReadOrDismissANotification() throws Exception {
        HrStaff requester = freshStaff("notify-owner-requester");
        HrStaff manager = freshStaff("notify-owner-manager");
        HrStaff outsider = freshStaff("notify-owner-outsider");
        String requesterToken = loginAs(requester);
        String managerToken = loginAs(manager);
        String outsiderToken = loginAs(outsider);

        String id = createAndSubmit(requesterToken, userId(manager));
        String noticeId = noticesFor(managerToken, id).get(0).get("id").asText();
        long unreadBefore = unreadCount(managerToken);
        assertTrue(unreadBefore >= 1);

        mockMvc.perform(post("/api/notifications/" + noticeId + "/read").header("Authorization", bearer(outsiderToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/notifications/" + noticeId).header("Authorization", bearer(outsiderToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/notifications/" + noticeId + "/read").header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk());
        assertEquals(unreadBefore - 1, unreadCount(managerToken));
        assertTrue(noticesFor(managerToken, id).get(0).hasNonNull("readAt"));

        mockMvc.perform(post("/api/notifications/read-all").header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk());
        assertEquals(0, unreadCount(managerToken));

        mockMvc.perform(delete("/api/notifications/" + noticeId).header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk());
        assertEquals(0, noticesFor(managerToken, id).size());
    }

    private String createAndSubmit(String token, String managerId) throws Exception {
        String created = mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"title\":\"Notification test\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(put("/api/requests/" + id + "?submit=true")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("""
                                {"orgUnitId":"%s","department":"Dean's office","designation":"Officer",
                                 "justification":"Because I need it","requestType":"New requirement",
                                 "businessContext":"Administration","managerId":"%s",
                                 "declarationAccepted":true,
                                 "items":[{"categoryId":"%s","quantity":1,"purpose":"testing"}]}
                                """.formatted(anyOrgUnitId(token), managerId, anyEquipmentCategoryId(token))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending_manager"));
        return id;
    }

    private void decide(String token, String id, String step, String decision, String expectedStatus) throws Exception {
        mockMvc.perform(post("/api/requests/" + id + "/" + step)
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{\"decision\":\"%s\",\"note\":\"test note\"}".formatted(decision)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(expectedStatus));
    }

    private String userId(HrStaff staff) {
        return userRepository.findByEmailIgnoreCase(staff.email()).orElseThrow().getId().toString();
    }

    /** This user's notices about one request, newest first. */
    private List<JsonNode> noticesFor(String token, String requestId) throws Exception {
        String body = mockMvc.perform(get("/api/notifications").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<JsonNode> mine = new ArrayList<>();
        for (JsonNode n : objectMapper.readTree(body)) {
            if (requestId.equals(n.path("requestId").asText())) mine.add(n);
        }
        return mine;
    }

    /** The status each notice announced (titles read "<reference> - <status>"), newest first. */
    private List<String> statusesNotified(String token, String requestId) throws Exception {
        return noticesFor(token, requestId).stream()
                .map(n -> n.get("title").asText().substring(n.get("title").asText().lastIndexOf(" - ") + 3))
                .toList();
    }

    private long unreadCount(String token) throws Exception {
        String body = mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("count").asLong();
    }
}
