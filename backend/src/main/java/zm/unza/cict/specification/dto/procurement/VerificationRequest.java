package zm.unza.cict.specification.dto.procurement;

import jakarta.validation.constraints.NotBlank;

/** result is "pass" or "needs_return"; notes is required when result is "needs_return". */
public record VerificationRequest(
        @NotBlank String result,
        String notes
) {
}
