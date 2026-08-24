package zm.unza.cict.specification.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/** decision is one of: approved, rejected, needs_clarification (manager or CICT step). */
public record RequestDecisionRequest(
        @NotBlank String decision,
        String note,
        List<RequestItemReviewRequest> itemDecisions
) {
}
