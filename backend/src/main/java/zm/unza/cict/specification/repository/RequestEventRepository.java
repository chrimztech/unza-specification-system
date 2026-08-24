package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestEvent;

import java.util.List;
import java.util.UUID;

public interface RequestEventRepository extends JpaRepository<RequestEvent, UUID> {
    List<RequestEvent> findByRequestIdOrderByCreatedAtDesc(UUID requestId);
}
