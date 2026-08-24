package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.domain.AuditLog;
import zm.unza.cict.specification.dto.audit.AuditLogResponse;
import zm.unza.cict.specification.repository.AuditLogRepository;
import zm.unza.cict.specification.security.AuthenticatedUser;
import zm.unza.cict.specification.security.CurrentUser;

import java.util.List;

/**
 * Records admin/configuration actions that request_events doesn't cover:
 * role changes, catalogue edits, attachment upload/delete, delegation
 * changes. The acting user is read from the current security context so
 * call sites don't need to thread an actor parameter through just for this.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String entityType, String entityId, String action, String details) {
        AuthenticatedUser actor = null;
        try {
            actor = CurrentUser.get();
        } catch (ForbiddenException ignored) {
            // System-initiated action with no authenticated caller (rare) - leave actor blank.
        }
        auditLogRepository.save(AuditLog.builder()
                .actorId(actor != null ? actor.id() : null)
                .actorEmail(actor != null ? actor.email() : null)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .details(details)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> recent(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(a -> new AuditLogResponse(
                        a.getId(), a.getActorId(), a.getActorEmail(), a.getEntityType(), a.getEntityId(),
                        a.getAction(), a.getDetails(), a.getCreatedAt()))
                .toList();
    }
}
