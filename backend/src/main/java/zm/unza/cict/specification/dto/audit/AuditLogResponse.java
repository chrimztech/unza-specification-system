package zm.unza.cict.specification.dto.audit;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        String actorName,
        String entityType,
        String entityId,
        String action,
        String details,
        String ipAddress,
        Instant createdAt
) {
}
