package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.TooManyRequestsException;
import zm.unza.cict.specification.dto.auth.LoginRequest;
import zm.unza.cict.specification.dto.auth.LoginResponse;
import zm.unza.cict.specification.dto.user.UserResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.security.LoginRateLimiter;
import zm.unza.cict.specification.service.AuditLogService;
import zm.unza.cict.specification.service.AuthService;
import zm.unza.cict.specification.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final LoginRateLimiter loginRateLimiter;
    private final AuditLogService auditLogService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        String identifier = req.identifier().trim();
        // What was typed is recorded on failure; cap it so junk input can't bloat the log.
        String attempted = identifier.length() > 200 ? identifier.substring(0, 200) : identifier;
        try {
            loginRateLimiter.assertNotLocked(identifier);
        } catch (TooManyRequestsException ex) {
            auditLogService.logAs(null, attempted, "Auth", null, "sign_in_blocked",
                    "Sign-in refused: too many failed attempts");
            throw ex;
        }
        try {
            LoginResponse response = authService.login(identifier, req.password());
            loginRateLimiter.recordSuccess(identifier);
            auditLogService.logAs(response.user().id(), response.user().email(), "Auth",
                    response.user().id().toString(), "sign_in", "Signed in");
            return response;
        } catch (RuntimeException ex) {
            loginRateLimiter.recordFailure(identifier);
            // The password is never recorded, only who tried and why it failed.
            auditLogService.logAs(null, attempted, "Auth", null, "sign_in_failed",
                    "Sign-in failed: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
            throw ex;
        }
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.get(CurrentUser.get().id());
    }
}
