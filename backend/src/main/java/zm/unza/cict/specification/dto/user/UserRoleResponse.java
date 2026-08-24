package zm.unza.cict.specification.dto.user;

import java.util.UUID;

public record UserRoleResponse(UUID id, UUID userId, String role) {
}
