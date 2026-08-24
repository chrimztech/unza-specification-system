package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "equipment_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    private String icon;

    @Column(name = "asset_class")
    private String assetClass;

    @Column(name = "typical_lifespan_years")
    private Integer typicalLifespanYears;

    @Column(name = "standard_warranty_months")
    private Integer standardWarrantyMonths;

    @Column(name = "indicative_unit_cost")
    private BigDecimal indicativeUnitCost;

    @Column(name = "requires_cict_review", nullable = false)
    @Builder.Default
    private boolean requiresCictReview = true;

    @Column(name = "requires_network_port", nullable = false)
    @Builder.Default
    private boolean requiresNetworkPort = false;

    @Column(name = "requires_software_licence", nullable = false)
    @Builder.Default
    private boolean requiresSoftwareLicence = false;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "eligible_position_levels", nullable = false)
    @Builder.Default
    private List<String> eligiblePositionLevels = List.of();

    @Column(name = "procurement_lead_time_days")
    private Integer procurementLeadTimeDays;

    @Column(name = "support_notes")
    private String supportNotes;

    @Column(name = "policy_reference")
    private String policyReference;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
