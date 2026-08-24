package zm.unza.cict.specification.common.enums;

public enum RequestStatus {
    DRAFT,
    PENDING_MANAGER,
    PENDING_CICT,
    NEEDS_CLARIFICATION,
    APPROVED,
    PROCUREMENT,
    PURCHASED,
    IN_STORES,
    COMPLETED,
    RETURN_REQUIRED,
    REJECTED,
    WITHDRAWN;

    public String dbValue() {
        return name().toLowerCase();
    }

    public static RequestStatus fromDbValue(String value) {
        return RequestStatus.valueOf(value.toUpperCase());
    }
}
