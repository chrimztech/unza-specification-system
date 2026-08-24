package zm.unza.cict.specification.dto.audit;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        String entityType,
        String entityId,
        String action,
        String details,
        Instant createdAt
) {
}
