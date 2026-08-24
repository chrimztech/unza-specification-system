package zm.unza.cict.specification.dto.catalogue;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public record EquipmentCategoryRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        String icon,
        String assetClass,
        Integer typicalLifespanYears,
        Integer standardWarrantyMonths,
        BigDecimal indicativeUnitCost,
        Boolean requiresCictReview,
        Boolean requiresNetworkPort,
        Boolean requiresSoftwareLicence,
        List<String> eligiblePositionLevels,
        Integer procurementLeadTimeDays,
        String supportNotes,
        String policyReference,
        Boolean active,
        Integer sortOrder
) {
}
