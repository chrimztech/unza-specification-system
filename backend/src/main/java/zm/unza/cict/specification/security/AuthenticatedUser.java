package zm.unza.cict.specification.security;

import java.util.List;
import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, List<String> roles) {

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    public boolean isCict() {
        return hasRole("cict_reviewer") || hasRole("cict_manager") || hasRole("admin");
    }

    public boolean isOversight() {
        return isCict() || hasRole("procurement") || hasRole("auditor")
                || hasRole("stores") || hasRole("cict_support");
    }

    public boolean isAdmin() {
        return hasRole("admin");
    }
}
