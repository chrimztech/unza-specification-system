package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import zm.unza.cict.specification.domain.Request;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RequestRepository extends JpaRepository<Request, UUID> {

    @EntityGraph(attributePaths = {"items"})
    Optional<Request> findWithItemsById(UUID id);

    /**
     * Mirrors the old Supabase RLS visibility rule: oversight roles see everything,
     * everyone else sees requests where they are the requester, the submitter, the
     * assigned manager, or a currently-active delegate of that manager.
     */
    @Query("""
            select distinct r from Request r
            where :oversight = true
               or r.requester.id = :userId
               or r.submittedBy.id = :userId
               or r.manager.id = :userId
               or r.manager.id in :delegatedManagerIds
            order by r.createdAt desc
            """)
    List<Request> findVisibleForUser(@Param("userId") UUID userId,
                                      @Param("oversight") boolean oversight,
                                      @Param("delegatedManagerIds") List<UUID> delegatedManagerIds);

    boolean existsByReference(String reference);
}
