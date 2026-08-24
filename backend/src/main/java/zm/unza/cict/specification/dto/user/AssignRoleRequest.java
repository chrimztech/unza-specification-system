package zm.unza.cict.specification.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignRoleRequest(
        @NotNull UUID userId,
        @NotBlank String role
) {
}
