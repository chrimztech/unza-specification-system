package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.OrgUnit;

import java.util.Optional;
import java.util.UUID;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, UUID> {
    Optional<OrgUnit> findByCodeIgnoreCase(String code);
    Optional<OrgUnit> findByNameIgnoreCase(String name);
}
