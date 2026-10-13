package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.common.enums.RequestStatus;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.Notification;
import zm.unza.cict.specification.domain.Request;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.dto.notification.NotificationResponse;
import zm.unza.cict.specification.repository.DelegationRepository;
import zm.unza.cict.specification.repository.NotificationRepository;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.repository.UserRoleAssignmentRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Mirrors the old `notify_request_status` Postgres trigger. */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final DelegationRepository delegationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void notifyStatusChange(Request request, RequestStatus previousStatus, UUID actorId) {
        if (previousStatus == request.getStatus()) return;

        List<UUID> recipients = new ArrayList<>();
        if (request.getStatus() == RequestStatus.PENDING_MANAGER && request.getManager() != null) {
            UUID managerId = request.getManager().getId();
            recipients.add(managerId);
            recipients.addAll(delegationRepository.findActiveDelegateIdsOf(managerId, Instant.now()));
        } else if (request.getStatus() == RequestStatus.PENDING_CICT) {
            userRoleAssignmentRepository.findByRoleIn(List.of(AppRole.CICT_REVIEWER, AppRole.CICT_MANAGER))
                    .forEach(a -> recipients.add(a.getUser().getId()));
        } else {
            recipients.add(request.getRequester().getId());
            recipients.add(request.getSubmittedBy().getId());
        }

        String statusLabel = request.getStatus().dbValue().replace('_', ' ');
        String message = "Request " + request.getReference() + " is now " + statusLabel + ".";
        String title = request.getReference() + " - " + statusLabel;
        String body = (request.getTitle() == null || request.getTitle().isBlank() ? "Equipment request" : request.getTitle())
                + " - " + message;

        List<UUID> recipientIds = recipients.stream().distinct()
                .filter(r -> r != null && !r.equals(actorId))
                .toList();

        recipientIds.forEach(userId -> notificationRepository.save(Notification.builder()
                .user(User.builder().id(userId).build())
                .request(request)
                .title(title)
                .body(body)
                .build()));

        if (emailService.isEnabled() && !recipientIds.isEmpty()) {
            userRepository.findAllById(recipientIds)
                    .forEach(user -> emailService.send(user.getEmail(), title, body));
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listMine(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationResponse markRead(UUID id, UUID userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found."));
        assertOwner(notification, userId);
        notification.setReadAt(Instant.now());
        return toResponse(notification);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> n.getReadAt() == null)
                .forEach(n -> n.setReadAt(Instant.now()));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found."));
        assertOwner(notification, userId);
        notificationRepository.delete(notification);
    }

    private void assertOwner(Notification notification, UUID userId) {
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this notification.");
        }
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getRequest() != null ? n.getRequest().getId() : null,
                n.getTitle(), n.getBody(), n.getCategory(), n.getReadAt(), n.getCreatedAt()
        );
    }
}
