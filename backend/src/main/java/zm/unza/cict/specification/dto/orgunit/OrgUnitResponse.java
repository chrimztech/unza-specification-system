package zm.unza.cict.specification.dto.orgunit;

import java.time.Instant;
import java.util.UUID;

public record OrgUnitResponse(
        UUID id,
        String code,
        String name,
        String unitType,
        UUID parentId,
        String campus,
        boolean active,
        Instant createdAt
) {
}
