package zm.unza.cict.specification.dto.delegation;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.time.Instant;
import java.util.UUID;

public record DelegationResponse(
        UUID id,
        UserRefResponse delegator,
        UserRefResponse delegate,
        String reason,
        Instant startsAt,
        Instant endsAt,
        boolean active,
        Instant createdAt
) {
}
