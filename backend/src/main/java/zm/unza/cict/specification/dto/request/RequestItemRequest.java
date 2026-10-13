package zm.unza.cict.specification.dto.request;

import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record RequestItemRequest(
        UUID id,
        UUID categoryId,
        @Positive Integer quantity,
        String intendedUsers,
        @Positive Integer numberOfUsers,
        String location,
        String designation,
        Boolean isShared,
        String purpose,
        String requiredSoftware,
        String softwareCategory,
        String proposedSpec,
        UUID recommendedProfileId,
        Integer sortOrder
) {
}
