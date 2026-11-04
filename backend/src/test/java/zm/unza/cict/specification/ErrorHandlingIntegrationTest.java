package zm.unza.cict.specification;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Client mistakes must come back as clear 4xx errors in the standard shape, never as a 500. */
class ErrorHandlingIntegrationTest extends AbstractIntegrationTest {

    @Test
    void anUnknownEndpointIsA404() throws Exception {
        String token = loginAs(freshStaff("errors-404"));
        mockMvc.perform(get("/api/does-not-exist").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void aWrongHttpMethodIsA405() throws Exception {
        String token = loginAs(freshStaff("errors-405"));
        mockMvc.perform(delete("/api/settings").header("Authorization", bearer(token)))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    void malformedJsonIsA400() throws Exception {
        String token = loginAs(freshStaff("errors-400"));
        mockMvc.perform(post("/api/requests?submit=false")
                        .header("Authorization", bearer(token))
                        .contentType("application/json")
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The request body is missing or is not valid JSON."));
    }

    @Test
    void aMalformedIdIsA400() throws Exception {
        String token = loginAs(freshStaff("errors-uuid"));
        mockMvc.perform(get("/api/requests/not-a-uuid").header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest());
    }
}
