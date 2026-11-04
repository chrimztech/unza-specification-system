package zm.unza.cict.specification.dto.audit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A user printed or saved an official document; recorded in the audit log. */
public record DocumentExportRequest(
        @NotBlank @Size(max = 120) String document,
        @Size(max = 200) String reference
) {
}
