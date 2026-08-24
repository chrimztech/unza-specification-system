package zm.unza.cict.specification.dto.request;

import zm.unza.cict.specification.dto.orgunit.OrgUnitResponse;
import zm.unza.cict.specification.dto.user.UserRefResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RequestResponse(
        UUID id,
        String reference,
        UserRefResponse requester,
        UserRefResponse submittedBy,
        String requestedFor,
        UserRefResponse onBehalfOf,
        OrgUnitResponse orgUnit,
        String orgUnitName,
        UserRefResponse manager,
        String title,
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
        BigDecimal estimatedBudget,
        String existingAssetTag,
        String existingAssetDetails,
        String replacementReason,
        boolean declarationAccepted,
        Instant declarationAt,
        String status,
        String managerDecisionNote,
        Instant managerDecidedAt,
        String cictDecisionNote,
        UserRefResponse cictDecidedBy,
        Instant cictDecidedAt,
        Instant submittedAt,
        Instant createdAt,
        Instant updatedAt,
        List<RequestItemResponse> items
) {
}
