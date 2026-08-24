package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByStaffNumberIgnoreCase(String staffNumber);
    boolean existsByEmailIgnoreCase(String email);
}
