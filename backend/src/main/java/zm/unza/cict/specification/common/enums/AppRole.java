package zm.unza.cict.specification.common.enums;

public enum AppRole {
    REQUESTER,
    MANAGER,
    CICT_REVIEWER,
    CICT_MANAGER,
    PROCUREMENT,
    STORES,
    CICT_SUPPORT,
    AUDITOR,
    ADMIN;

    public String dbValue() {
        return name().toLowerCase();
    }

    public static AppRole fromDbValue(String value) {
        return AppRole.valueOf(value.toUpperCase());
    }
}
