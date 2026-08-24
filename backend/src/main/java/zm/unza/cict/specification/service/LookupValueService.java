package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.LookupValue;
import zm.unza.cict.specification.dto.lookup.LookupValueRequest;
import zm.unza.cict.specification.dto.lookup.LookupValueResponse;
import zm.unza.cict.specification.repository.LookupValueRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LookupValueService {

    private final LookupValueRepository lookupValueRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<LookupValueResponse> list(boolean includeInactive) {
        var rows = includeInactive
                ? lookupValueRepository.findAllByOrderByListKeyAscSortOrderAsc()
                : lookupValueRepository.findByActiveTrueOrderByListKeyAscSortOrderAsc();
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LookupValueResponse create(LookupValueRequest req) {
        LookupValue value = LookupValue.builder()
                .listKey(req.listKey())
                .value(req.value())
                .label(req.label())
                .sortOrder(req.sortOrder() != null ? req.sortOrder() : 0)
                .active(req.active() == null || req.active())
                .build();
        value = lookupValueRepository.save(value);
        auditLogService.log("LookupValue", value.getId().toString(), "create", value.getListKey() + " = " + value.getValue());
        return toResponse(value);
    }

    @Transactional
    public LookupValueResponse update(UUID id, LookupValueRequest req) {
        LookupValue value = lookupValueRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Lookup value not found."));
        value.setListKey(req.listKey());
        value.setValue(req.value());
        value.setLabel(req.label());
        if (req.sortOrder() != null) value.setSortOrder(req.sortOrder());
        if (req.active() != null) value.setActive(req.active());
        auditLogService.log("LookupValue", value.getId().toString(), "update", value.getListKey() + " = " + value.getValue());
        return toResponse(value);
    }

    @Transactional
    public void delete(UUID id) {
        LookupValue value = lookupValueRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Lookup value not found."));
        auditLogService.log("LookupValue", id.toString(), "delete", value.getListKey() + " = " + value.getValue());
        lookupValueRepository.deleteById(id);
    }

    private LookupValueResponse toResponse(LookupValue v) {
        return new LookupValueResponse(v.getId(), v.getListKey(), v.getValue(), v.getLabel(), v.getSortOrder(), v.isActive());
    }
}
