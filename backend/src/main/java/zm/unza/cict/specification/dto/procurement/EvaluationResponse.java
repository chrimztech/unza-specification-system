package zm.unza.cict.specification.dto.procurement;

import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.time.Instant;
import java.util.UUID;

public record EvaluationResponse(
        UUID id,
        String reference,
        UUID quotationId,
        String result,
        String notes,
        UserRefResponse evaluatedBy,
        Instant evaluatedAt
) {
}
