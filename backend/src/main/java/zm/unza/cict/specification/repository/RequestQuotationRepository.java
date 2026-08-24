package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestQuotation;

import java.util.List;
import java.util.UUID;

public interface RequestQuotationRepository extends JpaRepository<RequestQuotation, UUID> {
    List<RequestQuotation> findByRequestIdOrderByCreatedAtDesc(UUID requestId);
}
