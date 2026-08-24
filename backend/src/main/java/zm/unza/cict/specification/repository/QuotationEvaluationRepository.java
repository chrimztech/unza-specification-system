package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.QuotationEvaluation;

import java.util.List;
import java.util.UUID;

public interface QuotationEvaluationRepository extends JpaRepository<QuotationEvaluation, UUID> {
    List<QuotationEvaluation> findByQuotationIdOrderByEvaluatedAtDesc(UUID quotationId);
    List<QuotationEvaluation> findByQuotationRequestIdOrderByEvaluatedAtDesc(UUID requestId);
}
