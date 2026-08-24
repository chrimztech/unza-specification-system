package zm.unza.cict.specification.dto.procurement;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PurchaseResponse(
        UUID id,
        UUID requestId,
        UUID quotationId,
        String purchaseOrderNumber,
        String vendorName,
        BigDecimal amount,
        String currency,
        UserRefResponse purchasedBy,
        Instant purchasedAt,
        String notes
) {
}
