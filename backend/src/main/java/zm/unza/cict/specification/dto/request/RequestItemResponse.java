package zm.unza.cict.specification.dto.request;

import zm.unza.cict.specification.dto.catalogue.SpecProfileResponse;

import java.util.Map;
import java.util.UUID;

public record RequestItemResponse(
        UUID id,
        UUID categoryId,
        String categoryCode,
        String categoryName,
        int quantity,
        String intendedUsers,
        String location,
        boolean isShared,
        String purpose,
        String requiredSoftware,
        String proposedSpec,
        SpecProfileResponse recommendedProfile,
        SpecProfileResponse approvedProfile,
        Map<String, Object> approvedSpecSnapshot,
        String exceptionJustification,
        String reviewerNote,
        int sortOrder
) {
}
