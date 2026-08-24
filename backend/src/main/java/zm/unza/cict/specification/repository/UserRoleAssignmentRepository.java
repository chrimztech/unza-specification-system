package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.domain.UserRoleAssignment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, UUID> {
    List<UserRoleAssignment> findByUserId(UUID userId);
    Optional<UserRoleAssignment> findByUserIdAndRole(UUID userId, AppRole role);
    boolean existsByUserIdAndRole(UUID userId, AppRole role);
    boolean existsByRole(AppRole role);
    List<UserRoleAssignment> findByRoleIn(List<AppRole> roles);
    void deleteByUserIdAndRole(UUID userId, AppRole role);
}
