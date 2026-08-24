package zm.unza.cict.specification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.audit.AuditLogResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.AuditLogService;

import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public List<AuditLogResponse> recent(@RequestParam(defaultValue = "200") int limit) {
        var user = CurrentUser.get();
        if (!user.isAdmin() && !user.hasRole("auditor")) {
            throw new ForbiddenException("Administrators and auditors only.");
        }
        return auditLogService.recent(Math.min(limit, 500));
    }
}
