package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.RequestStatus;
import zm.unza.cict.specification.domain.Request;
import zm.unza.cict.specification.domain.RequestEvent;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.dto.request.RequestEventResponse;
import zm.unza.cict.specification.repository.RequestEventRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestEventService {

    private final RequestEventRepository requestEventRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public void log(Request request, UUID actorId, String actorName, String action,
                     RequestStatus from, RequestStatus to, String comment) {
        requestEventRepository.save(RequestEvent.builder()
                .request(request)
                .actor(actorId != null ? User.builder().id(actorId).build() : null)
                .actorName(actorName)
                .action(action)
                .fromStatus(from)
                .toStatus(to)
                .comment(comment)
                .build());

        // Every workflow step also goes into the system-wide audit trail.
        StringBuilder details = new StringBuilder(request.getReference() != null ? request.getReference() : "Draft request");
        if (to != null && to != from) {
            details.append(" · ").append(from != null ? label(from) : "new").append(" → ").append(label(to));
        }
        if (comment != null && !comment.isBlank()) details.append(" · ").append(comment.trim());
        auditLogService.log("Request", request.getId() != null ? request.getId().toString() : null, action, details.toString());
    }

    private static String label(RequestStatus status) {
        return status.dbValue().replace('_', ' ');
    }

    @Transactional(readOnly = true)
    public List<RequestEventResponse> list(UUID requestId) {
        return requestEventRepository.findByRequestIdOrderByCreatedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    private RequestEventResponse toResponse(RequestEvent e) {
        return new RequestEventResponse(
                e.getId(), e.getActor() != null ? e.getActor().getId() : null, e.getActorName(),
                e.getAction(), e.getFromStatus() != null ? e.getFromStatus().dbValue() : null,
                e.getToStatus() != null ? e.getToStatus().dbValue() : null, e.getComment(), e.getCreatedAt()
        );
    }
}
