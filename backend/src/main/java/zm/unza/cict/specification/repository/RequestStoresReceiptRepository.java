package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestStoresReceipt;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RequestStoresReceiptRepository extends JpaRepository<RequestStoresReceipt, UUID> {
    List<RequestStoresReceipt> findByRequestIdOrderByReceivedAtDesc(UUID requestId);
    Optional<RequestStoresReceipt> findFirstByRequestIdOrderByReceivedAtDesc(UUID requestId);
}
