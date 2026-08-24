package zm.unza.cict.specification.dto.request;

import java.time.Instant;
import java.util.UUID;

public record RequestAttachmentResponse(
        UUID id,
        UUID requestId,
        String fileName,
        String contentType,
        Long sizeBytes,
        String kind,
        UUID uploadedById,
        Instant createdAt
) {
}
