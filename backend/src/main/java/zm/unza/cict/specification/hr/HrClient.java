package zm.unza.cict.specification.hr;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import zm.unza.cict.specification.common.exception.HrIntegrationException;
import zm.unza.cict.specification.config.AppProperties;

/**
 * UNZA HR system integration.
 * <p>
 * Authentication is a two-step process against the live UNZA HR API:
 * 1. POST {login-url}    { username, password } -> HR access token
 * 2. GET  {metadata-url}  Authorization: Bearer {hr-token} -> staff profile
 * <p>
 * Only staff with status = 1 (active) in HR are allowed to sign in.
 */
@Slf4j
@Component
public class HrClient {

    private final AppProperties.Hr config;
    private final RestClient restClient;

    public HrClient(AppProperties properties, RestClient.Builder restClientBuilder) {
        this.config = properties.hr();
        this.restClient = restClientBuilder.build();
    }

    public boolean isConfigured() {
        return config != null && config.configured();
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new HrIntegrationException(
                    "The HR system connection is not configured yet. Contact CICT to complete the HR integration.");
        }
    }

    public HrStaff authenticate(String username, String password) {
        requireConfigured();
        String loginUsername = username.trim();

        HrLoginResponse login;
        try {
            login = restClient.post()
                    .uri(config.loginUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new HrLoginRequest(loginUsername, password))
                    .retrieve()
                    .onStatus(this::isAuthError, (req, res) -> {
                        throw new HrIntegrationException("Those staff credentials were not accepted by the HR system.");
                    })
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        throw new HrIntegrationException("The HR system rejected the sign-in request.");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        throw new HrIntegrationException("The HR system returned an error. Contact CICT if this continues.");
                    })
                    .body(HrLoginResponse.class);
        } catch (HrIntegrationException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("HR login request failed", e);
            throw new HrIntegrationException("The HR system could not be reached. Please try again shortly.");
        }

        if (login == null || login.token() == null || login.token().isBlank()) {
            throw new HrIntegrationException("Those staff credentials were not accepted by the HR system.");
        }

        HrMetadataResponse metadata;
        try {
            metadata = restClient.get()
                    .uri(config.metadataUrl())
                    .header("Authorization", "Bearer " + login.token())
                    .header("Accept", "application/json")
                    .retrieve()
                    .onStatus(this::isAuthError, (req, res) -> {
                        throw new HrIntegrationException("Those staff credentials were not accepted by the HR system.");
                    })
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        throw new HrIntegrationException("The HR system rejected the profile request.");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        throw new HrIntegrationException("The HR system returned an error. Contact CICT if this continues.");
                    })
                    .body(HrMetadataResponse.class);
        } catch (HrIntegrationException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("HR metadata request failed", e);
            throw new HrIntegrationException("Failed to retrieve your staff profile. Please try again.");
        }

        if (metadata == null || metadata.response() == null || metadata.response().data() == null) {
            throw new HrIntegrationException("Failed to retrieve your staff profile.");
        }

        HrStaffData data = metadata.response().data();
        if (data.status() != 1) {
            throw new HrIntegrationException("Your staff account is not active. Please contact HR.");
        }

        return toHrStaff(data);
    }

    private HrStaff toHrStaff(HrStaffData data) {
        String email = trimToNull(data.email());
        String position = trimToNull(data.position());
        return new HrStaff(
                email != null ? email.toLowerCase() : null,
                buildFullName(data.firstName(), data.otherNames(), data.lastName()),
                trimToNull(data.manNumber()),
                position != null ? toTitleCase(position) : null,
                trimToNull(data.phone())
        );
    }

    private boolean isAuthError(HttpStatusCode status) {
        return status.value() == 401 || status.value() == 403;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildFullName(String first, String other, String last) {
        StringBuilder sb = new StringBuilder();
        if (first != null && !first.isBlank()) sb.append(toTitleCase(first.trim()));
        if (other != null && !other.isBlank()) sb.append(" ").append(toTitleCase(other.trim()));
        if (last != null && !last.isBlank()) sb.append(" ").append(toTitleCase(last.trim()));
        String name = sb.toString().trim();
        return name.isEmpty() ? "UNZA Staff" : name;
    }

    private String toTitleCase(String value) {
        String[] words = value.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                if (!sb.isEmpty()) sb.append(" ");
                sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
            }
        }
        return sb.toString();
    }

    // ── HR API DTOs ─────────────────────────────────────────────────────────
    // No global snake_case naming strategy is configured on this app's
    // ObjectMapper, so multi-word fields are mapped explicitly.

    private record HrLoginRequest(String username, String password) {
    }

    private record HrLoginResponse(
            String message,
            String token,
            @JsonProperty("expires_in") Integer expiresIn,
            @JsonProperty("token_type") String tokenType
    ) {
    }

    private record HrMetadataResponse(HrMetadataWrapper response) {
    }

    private record HrMetadataWrapper(int status, String message, HrStaffData data) {
    }

    private record HrStaffData(
            @JsonProperty("man_number") String manNumber,
            String title,
            @JsonProperty("first_name") String firstName,
            @JsonProperty("last_name") String lastName,
            @JsonProperty("other_names") String otherNames,
            String email,
            String phone,
            String position,
            @JsonProperty("position_hierarchy") String positionHierarchy,
            @JsonProperty("profile_image") String profileImage,
            int status
    ) {
    }
}
