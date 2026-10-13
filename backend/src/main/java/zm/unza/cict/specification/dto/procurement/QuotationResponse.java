package zm.unza.cict.specification.dto.procurement;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuotationResponse(
        UUID id,
        UUID requestId,
        String vendorName,
        BigDecimal amount,
        String currency,
        String notes,
        UUID attachmentId,
        String attachmentFileName,
        UserRefResponse submittedBy,
        Instant createdAt,
        List<EvaluationResponse> evaluations
) {
}
