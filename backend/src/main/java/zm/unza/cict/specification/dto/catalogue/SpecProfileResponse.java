package zm.unza.cict.specification.dto.catalogue;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record SpecProfileResponse(
        UUID id,
        UUID categoryId,
        String categoryCode,
        String categoryName,
        String tier,
        String name,
        String summary,
        Map<String, Object> specs,
        List<String> suitsPositionLevels,
        int version,
        boolean active,
        Instant createdAt
) {
}
