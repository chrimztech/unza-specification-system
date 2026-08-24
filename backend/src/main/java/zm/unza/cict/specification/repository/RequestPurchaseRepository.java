package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestPurchase;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RequestPurchaseRepository extends JpaRepository<RequestPurchase, UUID> {
    List<RequestPurchase> findByRequestIdOrderByPurchasedAtDesc(UUID requestId);
    Optional<RequestPurchase> findFirstByRequestIdOrderByPurchasedAtDesc(UUID requestId);
}
