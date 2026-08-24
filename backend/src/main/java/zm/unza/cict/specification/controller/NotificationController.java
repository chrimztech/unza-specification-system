package zm.unza.cict.specification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.dto.notification.NotificationResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.NotificationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> listMine() {
        return notificationService.listMine(CurrentUser.get().id());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount(CurrentUser.get().id()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable UUID id) {
        return notificationService.markRead(id, CurrentUser.get().id());
    }

    @PostMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead(CurrentUser.get().id());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        notificationService.delete(id, CurrentUser.get().id());
    }
}
