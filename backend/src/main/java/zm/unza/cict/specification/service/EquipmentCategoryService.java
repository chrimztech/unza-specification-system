package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.EquipmentCategory;
import zm.unza.cict.specification.dto.catalogue.EquipmentCategoryRequest;
import zm.unza.cict.specification.dto.catalogue.EquipmentCategoryResponse;
import zm.unza.cict.specification.repository.EquipmentCategoryRepository;
import zm.unza.cict.specification.repository.RequestItemRepository;
import zm.unza.cict.specification.repository.SpecProfileRepository;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EquipmentCategoryService {

    private final EquipmentCategoryRepository categoryRepository;
    private final SpecProfileRepository specProfileRepository;
    private final RequestItemRepository requestItemRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EquipmentCategoryResponse> list() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparingInt(EquipmentCategory::getSortOrder))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EquipmentCategoryResponse create(EquipmentCategoryRequest req) {
        EquipmentCategory category = new EquipmentCategory();
        apply(category, req);
        category = categoryRepository.save(category);
        auditLogService.log("EquipmentCategory", category.getId().toString(), "create", "Created category " + category.getCode() + " - " + category.getName());
        return toResponse(category);
    }

    @Transactional
    public EquipmentCategoryResponse update(UUID id, EquipmentCategoryRequest req) {
        EquipmentCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipment category not found."));
        apply(category, req);
        auditLogService.log("EquipmentCategory", category.getId().toString(), "update", "Updated category " + category.getCode());
        return toResponse(category);
    }

    @Transactional
    public void delete(UUID id) {
        EquipmentCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipment category not found."));
        // The FKs would silently null request items and cascade away its profiles, losing request history.
        if (requestItemRepository.existsByCategoryId(id)) {
            throw new BadRequestException("This category is used by existing requests. Retire it instead of deleting it.");
        }
        if (specProfileRepository.existsByCategoryId(id)) {
            throw new BadRequestException("This category still has specification profiles. Delete or move them first, or retire the category.");
        }
        auditLogService.log("EquipmentCategory", id.toString(), "delete", "Deleted category " + category.getCode());
        categoryRepository.deleteById(id);
    }

    private void apply(EquipmentCategory category, EquipmentCategoryRequest req) {
        category.setCode(req.code());
        category.setName(req.name());
        category.setDescription(req.description());
        category.setIcon(req.icon());
        category.setAssetClass(req.assetClass());
        category.setTypicalLifespanYears(req.typicalLifespanYears());
        category.setStandardWarrantyMonths(req.standardWarrantyMonths());
        category.setIndicativeUnitCost(req.indicativeUnitCost());
        if (req.requiresCictReview() != null) category.setRequiresCictReview(req.requiresCictReview());
        if (req.requiresNetworkPort() != null) category.setRequiresNetworkPort(req.requiresNetworkPort());
        if (req.requiresSoftwareLicence() != null) category.setRequiresSoftwareLicence(req.requiresSoftwareLicence());
        if (req.eligiblePositionLevels() != null) category.setEligiblePositionLevels(req.eligiblePositionLevels());
        category.setProcurementLeadTimeDays(req.procurementLeadTimeDays());
        category.setSupportNotes(req.supportNotes());
        category.setPolicyReference(req.policyReference());
        if (req.active() != null) category.setActive(req.active());
        if (req.sortOrder() != null) category.setSortOrder(req.sortOrder());
    }

    public EquipmentCategoryResponse toResponse(EquipmentCategory c) {
        return new EquipmentCategoryResponse(
                c.getId(), c.getCode(), c.getName(), c.getDescription(), c.getIcon(), c.getAssetClass(),
                c.getTypicalLifespanYears(), c.getStandardWarrantyMonths(), c.getIndicativeUnitCost(),
                c.isRequiresCictReview(), c.isRequiresNetworkPort(), c.isRequiresSoftwareLicence(),
                c.getEligiblePositionLevels(), c.getProcurementLeadTimeDays(), c.getSupportNotes(),
                c.getPolicyReference(), c.isActive(), c.getSortOrder()
        );
    }
}
