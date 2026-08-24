package zm.unza.cict.specification.dto.user;

import zm.unza.cict.specification.dto.orgunit.OrgUnitResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String staffNumber,
        String jobTitle,
        String positionLevel,
        String phone,
        String campus,
        OrgUnitResponse orgUnit,
        boolean active,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt
) {
}
