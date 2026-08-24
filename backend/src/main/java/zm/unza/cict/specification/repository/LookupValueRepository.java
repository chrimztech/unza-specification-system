package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.LookupValue;

import java.util.List;
import java.util.UUID;

public interface LookupValueRepository extends JpaRepository<LookupValue, UUID> {
    List<LookupValue> findAllByOrderByListKeyAscSortOrderAsc();
    List<LookupValue> findByActiveTrueOrderByListKeyAscSortOrderAsc();
    List<LookupValue> findByListKeyAndActiveTrue(String listKey);
}
