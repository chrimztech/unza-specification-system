package zm.unza.cict.specification.dto.orgunit;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record OrgUnitRequest(
        @NotBlank String code,
        @NotBlank String name,
        String unitType,
        UUID parentId,
        String campus,
        Boolean active
) {
}
