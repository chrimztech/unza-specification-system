package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.OrgUnit;
import zm.unza.cict.specification.dto.orgunit.OrgUnitRequest;
import zm.unza.cict.specification.dto.orgunit.OrgUnitResponse;
import zm.unza.cict.specification.repository.OrgUnitRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgUnitService {

    private final OrgUnitRepository orgUnitRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> list() {
        return orgUnitRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public OrgUnitResponse create(OrgUnitRequest req) {
        OrgUnit unit = OrgUnit.builder()
                .code(req.code())
                .name(req.name())
                .unitType(req.unitType() != null ? req.unitType() : "department")
                .campus(req.campus())
                .active(req.active() == null || req.active())
                .build();
        if (req.parentId() != null) {
            unit.setParent(orgUnitRepository.findById(req.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent org unit not found.")));
        }
        unit = orgUnitRepository.save(unit);
        auditLogService.log("OrgUnit", unit.getId().toString(), "create", "Created org unit " + unit.getCode() + " - " + unit.getName());
        return toResponse(unit);
    }

    @Transactional
    public OrgUnitResponse update(UUID id, OrgUnitRequest req) {
        OrgUnit unit = orgUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Org unit not found."));
        unit.setCode(req.code());
        unit.setName(req.name());
        if (req.unitType() != null) unit.setUnitType(req.unitType());
        unit.setCampus(req.campus());
        if (req.active() != null) unit.setActive(req.active());
        if (req.parentId() != null) {
            unit.setParent(orgUnitRepository.findById(req.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent org unit not found.")));
        } else {
            unit.setParent(null);
        }
        auditLogService.log("OrgUnit", unit.getId().toString(), "update", "Updated org unit " + unit.getCode());
        return toResponse(unit);
    }

    @Transactional
    public OrgUnitResponse setActive(UUID id, boolean active) {
        OrgUnit unit = orgUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Org unit not found."));
        unit.setActive(active);
        auditLogService.log("OrgUnit", unit.getId().toString(), active ? "activate" : "deactivate", unit.getCode());
        return toResponse(unit);
    }

    public OrgUnitResponse toResponse(OrgUnit unit) {
        if (unit == null) return null;
        return new OrgUnitResponse(
                unit.getId(), unit.getCode(), unit.getName(), unit.getUnitType(),
                unit.getParent() != null ? unit.getParent().getId() : null,
                unit.getCampus(), unit.isActive(), unit.getCreatedAt()
        );
    }
}
