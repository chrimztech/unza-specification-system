package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.dto.lookup.AppSettingResponse;
import zm.unza.cict.specification.repository.AppSettingRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private final AppSettingRepository appSettingRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<AppSettingResponse> list() {
        return appSettingRepository.findAll().stream()
                .map(s -> new AppSettingResponse(s.getKey(), s.getValue(), s.getDescription()))
                .toList();
    }

    @Transactional
    public AppSettingResponse update(String key, String value) {
        var setting = appSettingRepository.findById(key)
                .orElseThrow(() -> new NotFoundException("Setting not found."));
        String previous = setting.getValue();
        setting.setValue(value);
        auditLogService.log("AppSetting", key, "update", "Changed '" + key + "' from '" + previous + "' to '" + value + "'");
        return new AppSettingResponse(setting.getKey(), setting.getValue(), setting.getDescription());
    }
}
