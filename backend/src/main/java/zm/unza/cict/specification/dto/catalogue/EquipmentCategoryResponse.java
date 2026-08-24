package zm.unza.cict.specification.dto.catalogue;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record EquipmentCategoryResponse(
        UUID id,
        String code,
        String name,
        String description,
        String icon,
        String assetClass,
        Integer typicalLifespanYears,
        Integer standardWarrantyMonths,
        BigDecimal indicativeUnitCost,
        boolean requiresCictReview,
        boolean requiresNetworkPort,
        boolean requiresSoftwareLicence,
        List<String> eligiblePositionLevels,
        Integer procurementLeadTimeDays,
        String supportNotes,
        String policyReference,
        boolean active,
        int sortOrder
) {
}
