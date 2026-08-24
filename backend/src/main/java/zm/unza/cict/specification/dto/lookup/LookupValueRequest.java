package zm.unza.cict.specification.dto.lookup;

import jakarta.validation.constraints.NotBlank;

public record LookupValueRequest(
        @NotBlank String listKey,
        @NotBlank String value,
        @NotBlank String label,
        Integer sortOrder,
        Boolean active
) {
}
