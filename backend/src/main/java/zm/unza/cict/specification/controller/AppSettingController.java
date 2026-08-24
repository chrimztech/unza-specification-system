package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.lookup.AppSettingResponse;
import zm.unza.cict.specification.dto.lookup.AppSettingUpdateRequest;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.AppSettingService;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class AppSettingController {

    private final AppSettingService appSettingService;

    @GetMapping
    public List<AppSettingResponse> list() {
        return appSettingService.list();
    }

    @PutMapping("/{key}")
    public AppSettingResponse update(@PathVariable String key, @Valid @RequestBody AppSettingUpdateRequest req) {
        if (!CurrentUser.get().isAdmin()) {
            throw new ForbiddenException("Administrators only.");
        }
        return appSettingService.update(key, req.value());
    }
}
