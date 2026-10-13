package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.user.*;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> list() {
        return userService.list();
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable UUID id) {
        return userService.get(id);
    }

    @PatchMapping("/me")
    public UserResponse updateMyProfile(@RequestBody UpdateProfileRequest req) {
        var user = CurrentUser.get();
        // Position level and unit drive manager routing and spec tiers, so staff can't self-assign them.
        if (!user.isAdmin() && (req.positionLevel() != null || req.orgUnitId() != null)) {
            throw new ForbiddenException("Position level and organisational unit are maintained by HR.");
        }
        return userService.updateProfile(user.id(), req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requireAdmin();
        userService.delete(id, CurrentUser.get().id());
    }

    /** Mirrors the old `user_roles` RLS: everyone sees their own assignments, oversight roles see all. */
    @GetMapping("/roles")
    public List<UserRoleResponse> listRoleAssignments() {
        var user = CurrentUser.get();
        var all = userService.listRoleAssignments();
        if (user.isOversight()) return all;
        return all.stream().filter(r -> r.userId().equals(user.id())).toList();
    }

    @PostMapping("/roles")
    public UserRoleResponse assignRole(@Valid @RequestBody AssignRoleRequest req) {
        requireAdmin();
        return userService.assignRole(req);
    }

    @DeleteMapping("/roles/{assignmentId}")
    public void removeRole(@PathVariable UUID assignmentId) {
        requireAdmin();
        userService.removeRole(assignmentId, CurrentUser.get().id());
    }

    /** Manual staff provisioning by an administrator, used while HR sign-in is unavailable for an account. */
    @PostMapping("/staff-accounts")
    public UserResponse createStaffAccount(@Valid @RequestBody CreateStaffAccountRequest req) {
        requireAdmin();
        return userService.createStaffAccount(req);
    }

    private void requireAdmin() {
        if (!CurrentUser.get().isAdmin()) {
            throw new ForbiddenException("Administrators only.");
        }
    }
}
