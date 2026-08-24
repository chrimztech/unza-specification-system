package zm.unza.cict.specification.dto.procurement;

import jakarta.validation.constraints.NotBlank;

/** result is "pass" or "fail"; notes is required when result is "fail". */
public record EvaluationRequest(
        @NotBlank String result,
        String notes
) {
}
