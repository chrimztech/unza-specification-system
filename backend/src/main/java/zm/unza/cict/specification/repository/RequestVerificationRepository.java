package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestVerification;

import java.util.List;
import java.util.UUID;

public interface RequestVerificationRepository extends JpaRepository<RequestVerification, UUID> {
    List<RequestVerification> findByRequestIdOrderByVerifiedAtDesc(UUID requestId);
}
