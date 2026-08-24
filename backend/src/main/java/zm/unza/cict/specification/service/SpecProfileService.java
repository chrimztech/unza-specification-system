package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.EquipmentCategory;
import zm.unza.cict.specification.domain.SpecProfile;
import zm.unza.cict.specification.dto.catalogue.SpecProfileRequest;
import zm.unza.cict.specification.dto.catalogue.SpecProfileResponse;
import zm.unza.cict.specification.repository.EquipmentCategoryRepository;
import zm.unza.cict.specification.repository.SpecProfileRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpecProfileService {

    private static final List<String> TIER_ORDER = List.of("Standard", "Enhanced", "Specialised");

    private final SpecProfileRepository specProfileRepository;
    private final EquipmentCategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SpecProfileResponse> list() {
        return specProfileRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public SpecProfileResponse create(SpecProfileRequest req) {
        EquipmentCategory category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Equipment category not found."));
        SpecProfile profile = SpecProfile.builder()
                .category(category)
                .tier(req.tier())
                .name(req.name())
                .summary(req.summary())
                .specs(req.specs() != null ? req.specs() : Map.of())
                .suitsPositionLevels(req.suitsPositionLevels() != null ? req.suitsPositionLevels() : List.of())
                .version(req.version() != null ? req.version() : 1)
                .active(req.active() == null || req.active())
                .build();
        profile = specProfileRepository.save(profile);
        auditLogService.log("SpecProfile", profile.getId().toString(), "create", "Created profile " + profile.getName() + " (" + profile.getTier() + ")");
        return toResponse(profile);
    }

    @Transactional
    public SpecProfileResponse update(UUID id, SpecProfileRequest req) {
        SpecProfile profile = specProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Spec profile not found."));
        if (req.categoryId() != null) {
            profile.setCategory(categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new NotFoundException("Equipment category not found.")));
        }
        profile.setTier(req.tier());
        profile.setName(req.name());
        profile.setSummary(req.summary());
        if (req.specs() != null) profile.setSpecs(req.specs());
        if (req.suitsPositionLevels() != null) profile.setSuitsPositionLevels(req.suitsPositionLevels());
        if (req.version() != null) profile.setVersion(req.version());
        if (req.active() != null) profile.setActive(req.active());
        auditLogService.log("SpecProfile", profile.getId().toString(), "update", "Updated profile " + profile.getName());
        return toResponse(profile);
    }

    @Transactional
    public void delete(UUID id) {
        SpecProfile profile = specProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Spec profile not found."));
        auditLogService.log("SpecProfile", id.toString(), "delete", "Deleted profile " + profile.getName());
        specProfileRepository.deleteById(id);
    }

    /** Mirrors the frontend's recommendProfile() heuristic in lib/requests.ts. */
    @Transactional(readOnly = true)
    public SpecProfile recommend(UUID categoryId, String positionLevel) {
        if (categoryId == null) return null;
        List<SpecProfile> forCategory = specProfileRepository.findByCategoryId(categoryId);
        if (forCategory.isEmpty()) return null;
        if (positionLevel != null) {
            var matched = forCategory.stream()
                    .filter(p -> p.getSuitsPositionLevels().contains(positionLevel))
                    .findFirst();
            if (matched.isPresent()) return matched.get();
        }
        return forCategory.stream()
                .min((a, b) -> Integer.compare(TIER_ORDER.indexOf(a.getTier()), TIER_ORDER.indexOf(b.getTier())))
                .orElse(forCategory.get(0));
    }

    public SpecProfileResponse toResponse(SpecProfile p) {
        if (p == null) return null;
        return new SpecProfileResponse(
                p.getId(), p.getCategory().getId(), p.getCategory().getCode(), p.getCategory().getName(),
                p.getTier(), p.getName(), p.getSummary(), p.getSpecs(), p.getSuitsPositionLevels(),
                p.getVersion(), p.isActive(), p.getCreatedAt()
        );
    }
}
