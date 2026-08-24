package zm.unza.cict.specification.dto.procurement;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.time.Instant;
import java.util.UUID;

public record StoresReceiptResponse(
        UUID id,
        UUID requestId,
        UUID purchaseId,
        UserRefResponse receivedBy,
        Instant receivedAt,
        String conditionNotes
) {
}
