package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;
import zm.unza.cict.specification.common.enums.RequestStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "request_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "actor_name")
    private String actorName;

    @Column(nullable = false)
    private String action;

    @Column(name = "from_status")
    private RequestStatus fromStatus;

    @Column(name = "to_status")
    private RequestStatus toStatus;

    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
