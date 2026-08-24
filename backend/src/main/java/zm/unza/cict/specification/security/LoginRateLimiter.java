package zm.unza.cict.specification.security;

import org.springframework.stereotype.Component;
import zm.unza.cict.specification.common.exception.TooManyRequestsException;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force guard for /api/auth/login, keyed by the submitted identifier
 * (staff number or email). After too many failed sign-ins in a row, further attempts
 * for that identifier are blocked for a cool-down period regardless of whether the
 * password is now correct — this deliberately does not distinguish "wrong password"
 * from "HR system unreachable" since both surface as the same HrIntegrationException.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCKOUT = Duration.ofMinutes(15);

    private record Attempt(int failures, Instant lockedUntil) {
    }

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String identifier) {
        Attempt attempt = attempts.get(key(identifier));
        if (attempt == null || attempt.lockedUntil() == null) return;
        Instant now = Instant.now();
        if (now.isBefore(attempt.lockedUntil())) {
            long minutes = Math.max(1, Duration.between(now, attempt.lockedUntil()).toMinutes() + 1);
            throw new TooManyRequestsException(
                    "Too many failed sign-in attempts. Try again in about " + minutes + " minute(s).");
        }
        attempts.remove(key(identifier));
    }

    public void recordFailure(String identifier) {
        attempts.compute(key(identifier), (k, current) -> {
            int failures = (current == null ? 0 : current.failures()) + 1;
            Instant lockedUntil = failures >= MAX_ATTEMPTS ? Instant.now().plus(LOCKOUT) : null;
            return new Attempt(failures, lockedUntil);
        });
    }

    public void recordSuccess(String identifier) {
        attempts.remove(key(identifier));
    }

    private String key(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase();
    }
}
