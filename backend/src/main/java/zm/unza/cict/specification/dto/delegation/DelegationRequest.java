package zm.unza.cict.specification.dto.delegation;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record DelegationRequest(
        @NotNull UUID delegateId,
        String reason,
        Instant startsAt,
        Instant endsAt
) {
}
