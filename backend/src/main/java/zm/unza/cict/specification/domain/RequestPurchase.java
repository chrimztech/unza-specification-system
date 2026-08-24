package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "request_purchases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private RequestQuotation quotation;

    @Column(name = "purchase_order_number")
    private String purchaseOrderNumber;

    @Column(name = "vendor_name", nullable = false)
    private String vendorName;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "ZMW";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchased_by")
    private User purchasedBy;

    @Column(name = "purchased_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant purchasedAt = Instant.now();

    private String notes;
}
