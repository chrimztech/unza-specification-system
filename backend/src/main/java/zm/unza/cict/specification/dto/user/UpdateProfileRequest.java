package zm.unza.cict.specification.dto.user;

import java.util.UUID;

public record UpdateProfileRequest(
        String fullName,
        String jobTitle,
        String positionLevel,
        String phone,
        String campus,
        UUID orgUnitId
) {
}
