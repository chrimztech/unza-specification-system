package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.OrgUnit;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.domain.UserRoleAssignment;
import zm.unza.cict.specification.dto.user.*;
import zm.unza.cict.specification.repository.OrgUnitRepository;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.repository.UserRoleAssignmentRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final OrgUnitService orgUnitService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(UUID id) {
        return toResponse(userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found.")));
    }

    @Transactional(readOnly = true)
    public List<UserRoleResponse> listRoleAssignments() {
        return userRoleAssignmentRepository.findAll().stream()
                .map(r -> new UserRoleResponse(r.getId(), r.getUser().getId(), r.getRole().dbValue()))
                .toList();
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
        if (req.fullName() != null) user.setFullName(req.fullName());
        if (req.jobTitle() != null) user.setJobTitle(req.jobTitle());
        if (req.positionLevel() != null) user.setPositionLevel(req.positionLevel());
        if (req.phone() != null) user.setPhone(req.phone());
        if (req.campus() != null) user.setCampus(req.campus());
        if (req.orgUnitId() != null) {
            OrgUnit unit = orgUnitRepository.findById(req.orgUnitId())
                    .orElseThrow(() -> new NotFoundException("Org unit not found."));
            user.setOrgUnit(unit);
        }
        return toResponse(user);
    }

    /** Manual staff provisioning by an administrator, used while HR sign-in is unavailable for an account. */
    @Transactional
    public UserResponse createStaffAccount(CreateStaffAccountRequest req) {
        String email = req.email().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        boolean isNew = user == null;
        if (isNew) {
            user = User.builder()
                    .email(email)
                    .fullName(req.fullName())
                    .staffNumber(req.staffNumber())
                    .jobTitle(req.jobTitle())
                    .build();
            user = userRepository.save(user);
            assignRoleIfAbsent(user, AppRole.REQUESTER);
        } else {
            user.setFullName(req.fullName());
            if (req.staffNumber() != null) user.setStaffNumber(req.staffNumber());
            if (req.jobTitle() != null) user.setJobTitle(req.jobTitle());
        }
        auditLogService.log("User", user.getId().toString(), isNew ? "staff_account_created" : "staff_account_updated",
                "Manually provisioned staff account for " + email);
        return toResponse(user);
    }

    /**
     * Permanently removes a user account. This cascades away every request they raised or
     * submitted (and, via the request, its items/events/attachments) — an explicit, informed
     * choice made when this was built, since the alternative (deactivating instead) was
     * rejected in favour of a true delete. Manager/CICT-decision/attachment-uploader references
     * on records that survive are set to null rather than blocked, so unrelated history isn't
     * held hostage by this one account.
     */
    @Transactional
    public void delete(UUID id, UUID actingUserId) {
        if (id.equals(actingUserId)) {
            throw new ForbiddenException("You cannot delete your own account.");
        }
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found."));
        String email = user.getEmail();
        auditLogService.log("User", id.toString(), "delete", "Deleted user account " + email);
        userRepository.delete(user);
    }

    @Transactional
    public UserRoleResponse assignRole(AssignRoleRequest req) {
        User user = userRepository.findById(req.userId())
                .orElseThrow(() -> new NotFoundException("User not found."));
        AppRole role = parseRole(req.role());
        boolean existed = userRoleAssignmentRepository.existsByUserIdAndRole(user.getId(), role);
        UserRoleAssignment assignment = userRoleAssignmentRepository.findByUserIdAndRole(user.getId(), role)
                .orElseGet(() -> userRoleAssignmentRepository.save(
                        UserRoleAssignment.builder().user(user).role(role).build()));
        if (!existed) {
            auditLogService.log("UserRole", user.getId().toString(), "role_assigned",
                    "Assigned role '" + role.dbValue() + "' to " + user.getEmail());
        }
        return new UserRoleResponse(assignment.getId(), user.getId(), role.dbValue());
    }

    @Transactional
    public void removeRole(UUID assignmentId, UUID actingUserId) {
        UserRoleAssignment assignment = userRoleAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Role assignment not found."));
        if (assignment.getUser().getId().equals(actingUserId) && assignment.getRole() == AppRole.ADMIN) {
            throw new ForbiddenException("Administrators cannot remove their own admin role.");
        }
        auditLogService.log("UserRole", assignment.getUser().getId().toString(), "role_removed",
                "Removed role '" + assignment.getRole().dbValue() + "' from " + assignment.getUser().getEmail());
        userRoleAssignmentRepository.deleteById(assignmentId);
    }

    @Transactional
    public void assignRoleIfAbsent(User user, AppRole role) {
        if (!userRoleAssignmentRepository.existsByUserIdAndRole(user.getId(), role)) {
            userRoleAssignmentRepository.save(UserRoleAssignment.builder().user(user).role(role).build());
            auditLogService.log("UserRole", user.getId().toString(), "role_assigned",
                    "Assigned default role '" + role.dbValue() + "' to " + user.getEmail());
        }
    }

    private AppRole parseRole(String value) {
        try {
            return AppRole.fromDbValue(value);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown role: " + value);
        }
    }

    public UserResponse toResponse(User user) {
        List<String> roles = userRoleAssignmentRepository.findByUserId(user.getId()).stream()
                .map(r -> r.getRole().dbValue())
                .toList();
        return new UserResponse(
                user.getId(), user.getEmail(), user.getFullName(), user.getStaffNumber(), user.getJobTitle(),
                user.getPositionLevel(), user.getPhone(), user.getCampus(),
                orgUnitService.toResponse(user.getOrgUnit()), user.isActive(), roles,
                user.getCreatedAt(), user.getUpdatedAt()
        );
    }
}
