package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.EquipmentCategory;
import zm.unza.cict.specification.domain.SpecProfile;
import zm.unza.cict.specification.dto.catalogue.SpecProfileRequest;
import zm.unza.cict.specification.dto.catalogue.SpecProfileResponse;
import zm.unza.cict.specification.repository.EquipmentCategoryRepository;
import zm.unza.cict.specification.repository.RequestItemRepository;
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
    private final RequestItemRepository requestItemRepository;
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
        // The FKs would silently null the recommended/approved profile on existing requests.
        if (requestItemRepository.existsByRecommendedProfileIdOrApprovedProfileId(id, id)) {
            throw new BadRequestException("This profile is referenced by existing requests. Retire it instead of deleting it.");
        }
        auditLogService.log("SpecProfile", id.toString(), "delete", "Deleted profile " + profile.getName());
        specProfileRepository.deleteById(id);
    }

    /**
     * Mirrors the frontend's recommendTier() heuristic in lib/domain.ts. Matching is
     * case-/whitespace-insensitive since the position level comes verbatim from the HR
     * system's free-text job title field and won't reliably match the curated tag casing
     * CICT uses on spec profiles otherwise.
     */
    @Transactional(readOnly = true)
    public SpecProfile recommend(UUID categoryId, String positionLevel) {
        return recommend(categoryId, positionLevel, null);
    }

    /**
     * As above, but a shared item's user count can push the recommendation up a tier even
     * when the position-level match alone would land on Standard — e.g. a printer shared by
     * a whole office needs higher-volume capacity than one person's desk printer, regardless
     * of that person's HR grade.
     */
    @Transactional(readOnly = true)
    public SpecProfile recommend(UUID categoryId, String positionLevel, Integer numberOfUsers) {
        if (categoryId == null) return null;
        List<SpecProfile> forCategory = specProfileRepository.findByCategoryId(categoryId).stream()
                .filter(SpecProfile::isActive)
                .toList();
        if (forCategory.isEmpty()) return null;

        SpecProfile matched = null;
        if (positionLevel != null && !positionLevel.isBlank()) {
            String trimmed = positionLevel.trim();
            matched = forCategory.stream()
                    .filter(p -> p.getSuitsPositionLevels().stream()
                            .anyMatch(level -> level.trim().equalsIgnoreCase(trimmed)))
                    .findFirst().orElse(null);
        }
        SpecProfile base = matched != null ? matched : lowestTier(forCategory);

        if (numberOfUsers != null && numberOfUsers > 1) {
            int requiredTierIndex = numberOfUsers > 15 ? 2 : numberOfUsers > 5 ? 1 : 0;
            if (TIER_ORDER.indexOf(base.getTier()) < requiredTierIndex) {
                SpecProfile escalated = forCategory.stream()
                        .filter(p -> TIER_ORDER.indexOf(p.getTier()) >= requiredTierIndex)
                        .min((a, b) -> Integer.compare(TIER_ORDER.indexOf(a.getTier()), TIER_ORDER.indexOf(b.getTier())))
                        .orElse(null);
                if (escalated != null) return escalated;
            }
        }
        return base;
    }

    private SpecProfile lowestTier(List<SpecProfile> forCategory) {
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
