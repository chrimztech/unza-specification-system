package zm.unza.cict.specification;

import org.junit.jupiter.api.Test;
import zm.unza.cict.specification.common.exception.HrIntegrationException;
import zm.unza.cict.specification.hr.HrStaff;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void validCredentialsIssueAToken() throws Exception {
        HrStaff staff = freshStaff("login-ok");
        String token = loginAs(staff);
        org.junit.jupiter.api.Assertions.assertFalse(token.isBlank());
    }

    @Test
    void rejectedCredentialsReturn502FromHrIntegrationFailure() throws Exception {
        when(hrClient.authenticate("nobody@unza.zm", "wrong"))
                .thenThrow(new HrIntegrationException("Those staff credentials were not accepted by the HR system."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"identifier":"nobody@unza.zm","password":"wrong"}
                                """))
                .andExpect(status().isBadGateway());
    }

    @Test
    void repeatedFailuresLockTheIdentifierOutWith429() throws Exception {
        String identifier = "locked-out-" + System.nanoTime() + "@unza.zm";
        when(hrClient.authenticate(identifier, "wrong"))
                .thenThrow(new HrIntegrationException("Those staff credentials were not accepted by the HR system."));

        String body = """
                {"identifier":"%s","password":"wrong"}
                """.formatted(identifier);

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                    .andExpect(status().isBadGateway());
        }

        mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isTooManyRequests());
    }
}
