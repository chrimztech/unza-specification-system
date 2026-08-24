package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.EquipmentCategory;

import java.util.Optional;
import java.util.UUID;

public interface EquipmentCategoryRepository extends JpaRepository<EquipmentCategory, UUID> {
    Optional<EquipmentCategory> findByCodeIgnoreCase(String code);
}
