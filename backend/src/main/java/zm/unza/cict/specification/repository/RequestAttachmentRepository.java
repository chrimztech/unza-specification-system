package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.RequestAttachment;

import java.util.List;
import java.util.UUID;

public interface RequestAttachmentRepository extends JpaRepository<RequestAttachment, UUID> {
    List<RequestAttachment> findByRequestIdOrderByCreatedAtDesc(UUID requestId);
}
