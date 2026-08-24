package zm.unza.cict.specification.dto.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID requestId,
        String title,
        String body,
        String category,
        Instant readAt,
        Instant createdAt
) {
}
