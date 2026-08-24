package zm.unza.cict.specification.dto.catalogue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record SpecProfileRequest(
        @NotNull UUID categoryId,
        @NotBlank String tier,
        @NotBlank String name,
        String summary,
        Map<String, Object> specs,
        List<String> suitsPositionLevels,
        Integer version,
        Boolean active
) {
}
