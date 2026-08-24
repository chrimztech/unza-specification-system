package zm.unza.cict.specification.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "spec_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private EquipmentCategory category;

    @Column(nullable = false)
    private String tier;

    @Column(nullable = false)
    private String name;

    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    @Builder.Default
    private Map<String, Object> specs = Map.of();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "suits_position_levels", nullable = false)
    @Builder.Default
    private List<String> suitsPositionLevels = List.of();

    @Column(nullable = false)
    @Builder.Default
    private int version = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
