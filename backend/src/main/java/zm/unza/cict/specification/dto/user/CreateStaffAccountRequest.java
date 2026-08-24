package zm.unza.cict.specification.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffAccountRequest(
        @NotBlank @Email @Size(max = 200) String email,
        @NotBlank @Size(min = 2, max = 160) String fullName,
        @Size(max = 60) String staffNumber,
        @Size(max = 160) String jobTitle
) {
}
