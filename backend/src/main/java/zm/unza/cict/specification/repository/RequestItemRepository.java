package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestItem;

import java.util.List;
import java.util.UUID;

public interface RequestItemRepository extends JpaRepository<RequestItem, UUID> {
    List<RequestItem> findByRequestIdOrderBySortOrderAsc(UUID requestId);

    boolean existsByCategoryId(UUID categoryId);

    boolean existsByRecommendedProfileIdOrApprovedProfileId(UUID recommendedProfileId, UUID approvedProfileId);
}
