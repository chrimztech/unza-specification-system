package zm.unza.cict.specification.dto.lookup;

import jakarta.validation.constraints.NotNull;

public record AppSettingUpdateRequest(@NotNull String value) {
}
