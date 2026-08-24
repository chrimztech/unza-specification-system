package zm.unza.cict.specification.dto.request;

import java.time.Instant;
import java.util.UUID;

public record RequestEventResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String action,
        String fromStatus,
        String toStatus,
        String comment,
        Instant createdAt
) {
}
