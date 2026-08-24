package zm.unza.cict.specification.dto.procurement;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.time.Instant;
import java.util.UUID;

public record VerificationResponse(
        UUID id,
        String reference,
        UUID requestId,
        UUID storesReceiptId,
        String result,
        String notes,
        UserRefResponse verifiedBy,
        Instant verifiedAt
) {
}
