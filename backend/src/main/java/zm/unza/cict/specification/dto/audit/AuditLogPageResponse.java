package zm.unza.cict.specification.dto.audit;

import java.util.List;

/** One page of audit entries plus the total number matching the filters. */
public record AuditLogPageResponse(List<AuditLogResponse> items, long total, int page, int size) {
}
