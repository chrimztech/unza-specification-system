package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import zm.unza.cict.specification.domain.Delegation;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DelegationRepository extends JpaRepository<Delegation, UUID> {

    List<Delegation> findByDelegatorIdOrDelegateIdOrderByCreatedAtDesc(UUID delegatorId, UUID delegateId);

    @Query("""
            select d.delegator.id from Delegation d
            where d.delegate.id = :delegateId
              and d.active = true
              and d.startsAt <= :now
              and (d.endsAt is null or d.endsAt > :now)
            """)
    List<UUID> findActiveDelegatorIdsFor(@Param("delegateId") UUID delegateId, @Param("now") Instant now);

    @Query("""
            select case when count(d) > 0 then true else false end from Delegation d
            where d.delegate.id = :delegateId and d.delegator.id = :delegatorId
              and d.active = true and d.startsAt <= :now and (d.endsAt is null or d.endsAt > :now)
            """)
    boolean actsFor(@Param("delegateId") UUID delegateId, @Param("delegatorId") UUID delegatorId, @Param("now") Instant now);

    @Query("""
            select d.delegate.id from Delegation d
            where d.delegator.id = :delegatorId and d.active = true
              and d.startsAt <= :now and (d.endsAt is null or d.endsAt > :now)
            """)
    List<UUID> findActiveDelegateIdsOf(@Param("delegatorId") UUID delegatorId, @Param("now") Instant now);
}
