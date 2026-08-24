package zm.unza.cict.specification.dto.request;

import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record RequestItemRequest(
        UUID id,
        UUID categoryId,
        @Positive Integer quantity,
        String intendedUsers,
        String location,
        Boolean isShared,
        String purpose,
        String requiredSoftware,
        String proposedSpec,
        UUID recommendedProfileId,
        Integer sortOrder
) {
}
