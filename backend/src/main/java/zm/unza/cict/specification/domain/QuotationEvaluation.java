package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quotation_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quotation_id", nullable = false)
    private RequestQuotation quotation;

    /** "pass" or "fail". */
    @Column(nullable = false)
    private String result;

    /** Reason for the outcome - required when result is "fail". */
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluated_by")
    private User evaluatedBy;

    @Column(name = "evaluated_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant evaluatedAt = Instant.now();
}
