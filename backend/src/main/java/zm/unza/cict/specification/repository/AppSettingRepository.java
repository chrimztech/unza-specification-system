package zm.unza.cict.specification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zm.unza.cict.specification.domain.AppSetting;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {
}
