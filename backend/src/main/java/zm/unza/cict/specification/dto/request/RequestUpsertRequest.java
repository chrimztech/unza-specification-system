package zm.unza.cict.specification.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Used for both creating a draft and editing an existing (non-terminal) request.
 * Fields that are only required once a request is submitted (title, justification, etc.)
 * are intentionally unconstrained here — draft saves allow partial data — and are checked
 * by {@code RequestService.validateForSubmission} instead.
 */
public record RequestUpsertRequest(
        String reference,
        String title,
        String requestedFor,
        UUID onBehalfOfId,
        UUID orgUnitId,
        String orgUnitName,
        UUID managerId,
        String justification,
        String requestType,
        String businessContext,
        String impactIfNotProvided,
        String priority,
        String priorityReason,
        LocalDate requiredBy,
        String fundingSource,
        String costCentre,
        String budgetStatus,
        @PositiveOrZero BigDecimal estimatedBudget,
        String existingAssetTag,
        String existingAssetDetails,
        String replacementReason,
        Boolean declarationAccepted,
        @Valid List<RequestItemRequest> items
) {
}
