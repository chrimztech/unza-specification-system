package zm.unza.cict.specification.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RequestEventCreateRequest(
        @NotBlank String action,
        String comment
) {
}
