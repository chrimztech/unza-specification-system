package zm.unza.cict.specification.hr;

public record HrStaff(
        String email,
        String fullName,
        String manNumber,
        String jobTitle,
        String phone,
        String positionLevel
) {
}
