package zm.unza.cict.specification.security;

import org.springframework.security.core.context.SecurityContextHolder;
import zm.unza.cict.specification.common.exception.ForbiddenException;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ForbiddenException("Not authenticated.");
        }
        return user;
    }
}
