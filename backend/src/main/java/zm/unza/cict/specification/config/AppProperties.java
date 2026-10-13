package zm.unza.cict.specification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Cors cors,
        Jwt jwt,
        Storage storage,
        Hr hr,
        Mail mail
) {
    public record Cors(List<String> allowedOrigins) {
    }

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Storage(String attachmentsDir) {
    }

    public record Hr(String loginUrl, String metadataUrl) {
        public boolean configured() {
            return loginUrl != null && !loginUrl.isBlank() && metadataUrl != null && !metadataUrl.isBlank();
        }
    }

    /** Email is opt-in: unset app.mail.enabled (or a blank spring.mail.host) means notifications stay in-app only. */
    public record Mail(boolean enabled, String from) {
    }
}
