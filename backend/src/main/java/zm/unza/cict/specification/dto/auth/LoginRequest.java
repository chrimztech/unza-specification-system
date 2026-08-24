package zm.unza.cict.specification.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(min = 3, max = 160) String identifier,
        @NotBlank @Size(min = 1, max = 200) String password
) {
}
