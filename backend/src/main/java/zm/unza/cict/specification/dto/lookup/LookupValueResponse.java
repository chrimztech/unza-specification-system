package zm.unza.cict.specification.dto.lookup;

import java.util.UUID;

public record LookupValueResponse(
        UUID id,
        String listKey,
        String value,
        String label,
        int sortOrder,
        boolean active
) {
}
