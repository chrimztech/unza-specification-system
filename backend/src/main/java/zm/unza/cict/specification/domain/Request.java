package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;
import zm.unza.cict.specification.common.enums.RequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(name = "requested_for")
    private String requestedFor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "on_behalf_of_id")
    private User onBehalfOf;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    @Column(name = "org_unit_name")
    private String orgUnitName;

    private String department;

    @Column(name = "designation")
    private String designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(nullable = false)
    @Builder.Default
    private String title = "";

    private String justification;

    @Column(name = "request_type")
    private String requestType;

    @Column(name = "business_context")
    private String businessContext;

    @Column(name = "impact_if_not_provided")
    private String impactIfNotProvided;

    @Column(nullable = false)
    @Builder.Default
    private String priority = "normal";

    @Column(name = "priority_reason")
    private String priorityReason;

    @Column(name = "required_by")
    private LocalDate requiredBy;

    @Column(name = "funding_source")
    private String fundingSource;

    @Column(name = "cost_centre")
    private String costCentre;

    @Column(name = "budget_status")
    private String budgetStatus;

    @Column(name = "estimated_budget")
    private BigDecimal estimatedBudget;

    @Column(name = "existing_asset_tag")
    private String existingAssetTag;

    @Column(name = "existing_asset_details")
    private String existingAssetDetails;

    @Column(name = "replacement_reason")
    private String replacementReason;

    @Column(name = "declaration_accepted", nullable = false)
    @Builder.Default
    private boolean declarationAccepted = false;

    @Column(name = "declaration_at")
    private Instant declarationAt;

    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.DRAFT;

    @Column(name = "manager_decision_note")
    private String managerDecisionNote;

    @Column(name = "manager_decided_at")
    private Instant managerDecidedAt;

    @Column(name = "cict_decision_note")
    private String cictDecisionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cict_decided_by")
    private User cictDecidedBy;

    @Column(name = "cict_decided_at")
    private Instant cictDecidedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<RequestItem> items = new ArrayList<>();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
