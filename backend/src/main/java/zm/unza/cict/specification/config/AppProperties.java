package zm.unza.cict.specification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Cors cors,
        Jwt jwt,
        Storage storage,
        Hr hr
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
}
