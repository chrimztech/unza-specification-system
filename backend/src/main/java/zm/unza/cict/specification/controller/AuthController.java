package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.dto.auth.LoginRequest;
import zm.unza.cict.specification.dto.auth.LoginResponse;
import zm.unza.cict.specification.dto.user.UserResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.security.LoginRateLimiter;
import zm.unza.cict.specification.service.AuthService;
import zm.unza.cict.specification.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final LoginRateLimiter loginRateLimiter;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        loginRateLimiter.assertNotLocked(req.identifier());
        try {
            LoginResponse response = authService.login(req.identifier(), req.password());
            loginRateLimiter.recordSuccess(req.identifier());
            return response;
        } catch (RuntimeException ex) {
            loginRateLimiter.recordFailure(req.identifier());
            throw ex;
        }
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.get(CurrentUser.get().id());
    }
}
