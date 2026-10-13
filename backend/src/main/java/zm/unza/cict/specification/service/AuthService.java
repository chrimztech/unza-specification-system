package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.dto.auth.LoginResponse;
import zm.unza.cict.specification.hr.HrClient;
import zm.unza.cict.specification.hr.HrStaff;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.security.JwtService;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final HrClient hrClient;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse login(String identifier, String password) {
        HrStaff staff = hrClient.authenticate(identifier, password);
        User user = syncStaffToProfile(staff, identifier.trim());
        return issueSession(user);
    }

    private LoginResponse issueSession(User user) {
        var roles = userService.toResponse(user).roles();
        String token = jwtService.issueToken(user.getId(), user.getEmail(), roles);
        return new LoginResponse(token, userService.toResponse(user));
    }

    /** Creates the account if needed and mirrors the HR record into the user profile. */
    private User syncStaffToProfile(HrStaff staff, String loginIdentifier) {
        String manNumber = staff.manNumber();
        String email = staff.email() != null ? staff.email() : loginIdentifier.toLowerCase();

        User user = manNumber != null
                ? userRepository.findByStaffNumberIgnoreCase(manNumber).orElse(null)
                : userRepository.findByEmailIgnoreCase(email).orElse(null);
        boolean isNew = user == null;

        if (isNew) {
            String resolvedEmail = userRepository.existsByEmailIgnoreCase(email)
                    ? (manNumber != null ? manNumber : loginIdentifier) + "@hr.unza.zm"
                    : email;
            user = User.builder().email(resolvedEmail).build();
        } else if (!email.equalsIgnoreCase(user.getEmail())) {
            UUID currentId = user.getId();
            boolean emailTaken = userRepository.findByEmailIgnoreCase(email)
                    .filter(other -> !other.getId().equals(currentId))
                    .isPresent();
            if (!emailTaken) user.setEmail(email);
        }

        user.setFullName(staff.fullName());
        if (manNumber != null) user.setStaffNumber(manNumber);
        if (staff.jobTitle() != null) user.setJobTitle(staff.jobTitle());
        if (staff.positionLevel() != null) user.setPositionLevel(staff.positionLevel());
        if (staff.phone() != null) user.setPhone(staff.phone());
        user.setHrSyncedAt(Instant.now());

        user = userRepository.save(user);
        if (isNew) {
            userService.assignRoleIfAbsent(user, AppRole.REQUESTER);
        }
        return user;
    }
}
