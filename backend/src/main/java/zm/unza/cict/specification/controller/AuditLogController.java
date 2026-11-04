package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.audit.AuditLogPageResponse;
import zm.unza.cict.specification.dto.audit.DocumentExportRequest;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.AuditLogService;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Read access to the activity trail for administrators and auditors. There is deliberately
 * no endpoint to edit or clear it; the database rejects that too.
 */
@RestController
@RequestMapping("/api/audit-log")
@RequiredArgsConstructor
public class AuditLogController {

    /** Day boundaries for the date filters are taken in Zambian time. */
    private static final ZoneId ZONE = ZoneId.of("Africa/Lusaka");

    private final AuditLogService auditLogService;

    @GetMapping
    public AuditLogPageResponse search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        assertCanRead();
        return auditLogService.search(
                from != null ? from.atStartOfDay(ZONE).toInstant() : null,
                to != null ? to.plusDays(1).atStartOfDay(ZONE).toInstant() : null,
                actor, entityType, action, q,
                Math.max(page, 0), Math.min(Math.max(size, 1), 2000));
    }

    @GetMapping("/entity-types")
    public List<String> entityTypes() {
        assertCanRead();
        return auditLogService.entityTypes();
    }

    /** Any signed-in user records that they printed or saved an official document. */
    @PostMapping("/document-export")
    public void documentExport(@Valid @RequestBody DocumentExportRequest req) {
        auditLogService.log("Document", req.reference(), "document_printed",
                req.document() + (req.reference() != null && !req.reference().isBlank() ? " · " + req.reference() : ""));
    }

    private void assertCanRead() {
        var user = CurrentUser.get();
        if (!user.isAdmin() && !user.hasRole("auditor")) {
            throw new ForbiddenException("Administrators and auditors only.");
        }
    }
}
