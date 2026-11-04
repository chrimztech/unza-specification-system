package zm.unza.cict.specification.service;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.domain.AuditLog;
import zm.unza.cict.specification.dto.audit.AuditLogPageResponse;
import zm.unza.cict.specification.dto.audit.AuditLogResponse;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.repository.AuditLogRepository;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.security.AuthenticatedUser;
import zm.unza.cict.specification.security.CurrentUser;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * The system-wide, append-only activity trail: sign-ins, every request workflow step,
 * procurement records, configuration and role changes, attachments, delegations and
 * official documents printed. The database refuses edits and deletions (see V18).
 * The acting user and their IP address are taken from the current request.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /** Records an action by the signed-in user (or the system, when there is none). */
    @Transactional
    public void log(String entityType, String entityId, String action, String details) {
        AuthenticatedUser actor = null;
        try {
            actor = CurrentUser.get();
        } catch (ForbiddenException ignored) {
            // System-initiated action with no authenticated caller - leave the actor blank.
        }
        save(actor != null ? actor.id() : null, actor != null ? actor.email() : null,
                entityType, entityId, action, details);
    }

    /**
     * Records an action for an explicitly named actor, e.g. a sign-in attempt, which happens
     * before anyone is authenticated. Runs in its own transaction so a failed sign-in, which
     * rolls back the caller, is still recorded.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAs(UUID actorId, String actorEmail, String entityType, String entityId,
                      String action, String details) {
        save(actorId, actorEmail, entityType, entityId, action, details);
    }

    private void save(UUID actorId, String actorEmail, String entityType, String entityId,
                      String action, String details) {
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                // The name is copied at the time of the action, so the entry still reads
                // correctly if the account is later renamed or removed.
                .actorName(actorId == null ? null : userRepository.findById(actorId)
                        .map(User::getFullName).filter(n -> !n.isBlank()).orElse(null))
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .details(details)
                .ipAddress(clientIp())
                .build());
    }

    @Transactional(readOnly = true)
    public AuditLogPageResponse search(Instant from, Instant to, String actor, String entityType,
                                       String action, String q, int page, int size) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (from != null) where.add(cb.greaterThanOrEqualTo(root.<Instant>get("createdAt"), from));
            if (to != null) where.add(cb.lessThan(root.<Instant>get("createdAt"), to));
            if (notBlank(actor)) where.add(cb.or(
                    cb.like(cb.lower(root.<String>get("actorEmail")), like(actor)),
                    cb.like(cb.lower(root.<String>get("actorName")), like(actor))));
            if (notBlank(entityType)) where.add(cb.equal(root.get("entityType"), entityType.trim()));
            if (notBlank(action)) where.add(cb.equal(root.get("action"), action.trim()));
            if (notBlank(q)) {
                String pattern = like(q);
                where.add(cb.or(
                        cb.like(cb.lower(root.<String>get("details")), pattern),
                        cb.like(cb.lower(root.<String>get("actorEmail")), pattern),
                        cb.like(cb.lower(root.<String>get("actorName")), pattern),
                        cb.like(cb.lower(root.<String>get("action")), pattern),
                        cb.like(cb.lower(root.<String>get("entityType")), pattern),
                        cb.like(cb.lower(root.<String>get("entityId")), pattern)));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
        Page<AuditLog> result = auditLogRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new AuditLogPageResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public List<String> entityTypes() {
        return auditLogRepository.findDistinctEntityTypes();
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return new AuditLogResponse(a.getId(), a.getActorId(), a.getActorEmail(), a.getActorName(), a.getEntityType(),
                a.getEntityId(), a.getAction(), a.getDetails(), a.getIpAddress(), a.getCreatedAt());
    }

    /** The caller's address; behind a reverse proxy, the first X-Forwarded-For entry. */
    private static String clientIp() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        HttpServletRequest request = attrs.getRequest();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (notBlank(forwarded)) {
            String first = forwarded.split(",")[0].trim();
            return first.length() > 64 ? first.substring(0, 64) : first;
        }
        return request.getRemoteAddr();
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String like(String value) {
        String escaped = value.trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
