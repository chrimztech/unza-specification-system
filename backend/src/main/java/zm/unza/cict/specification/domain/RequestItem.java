package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "request_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private EquipmentCategory category;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;

    @Column(name = "intended_users")
    private String intendedUsers;

    @Column(name = "number_of_users")
    private Integer numberOfUsers;

    private String location;

    @Column(name = "designation")
    private String designation;

    @Column(name = "is_shared", nullable = false)
    @Builder.Default
    private boolean shared = false;

    private String purpose;

    @Column(name = "required_software")
    private String requiredSoftware;

    @Column(name = "software_category")
    private String softwareCategory;

    @Column(name = "proposed_spec")
    private String proposedSpec;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_profile_id")
    private SpecProfile recommendedProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_profile_id")
    private SpecProfile approvedProfile;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "approved_spec_snapshot")
    private Map<String, Object> approvedSpecSnapshot;

    @Column(name = "exception_justification")
    private String exceptionJustification;

    @Column(name = "reviewer_note")
    private String reviewerNote;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
