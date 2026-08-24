package zm.unza.cict.specification.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.repository.UserRoleAssignmentRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Trusts the JWT only for identity (the subject). Roles and active-status are
 * re-read from the database on every request rather than taken from the
 * token's own "roles" claim, so a role change or account deactivation takes
 * effect immediately instead of waiting for the token to expire (up to 8h).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parse(token);
                UUID userId = UUID.fromString(claims.getSubject());
                User dbUser = userRepository.findById(userId).orElse(null);
                if (dbUser != null && dbUser.isActive()) {
                    List<String> roles = userRoleAssignmentRepository.findByUserId(userId).stream()
                            .map(r -> r.getRole().dbValue())
                            .toList();
                    AuthenticatedUser user = new AuthenticatedUser(userId, dbUser.getEmail(), roles);
                    List<GrantedAuthority> authorities = roles.stream()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                            .map(GrantedAuthority.class::cast)
                            .toList();
                    var authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    SecurityContextHolder.clearContext();
                }
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
