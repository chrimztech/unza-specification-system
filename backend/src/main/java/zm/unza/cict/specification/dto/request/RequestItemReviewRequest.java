package zm.unza.cict.specification.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record RequestItemReviewRequest(
        @NotNull UUID itemId,
        UUID approvedProfileId,
        Map<String, Object> approvedSpecSnapshot,
        String exceptionJustification,
        String reviewerNote
) {
}
