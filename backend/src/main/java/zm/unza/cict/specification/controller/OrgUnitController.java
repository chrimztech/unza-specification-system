package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.orgunit.OrgUnitRequest;
import zm.unza.cict.specification.dto.orgunit.OrgUnitResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.OrgUnitService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/org-units")
@RequiredArgsConstructor
public class OrgUnitController {

    private final OrgUnitService orgUnitService;

    @GetMapping
    public List<OrgUnitResponse> list() {
        return orgUnitService.list();
    }

    @PostMapping
    public OrgUnitResponse create(@Valid @RequestBody OrgUnitRequest req) {
        requireAdmin();
        return orgUnitService.create(req);
    }

    @PutMapping("/{id}")
    public OrgUnitResponse update(@PathVariable UUID id, @Valid @RequestBody OrgUnitRequest req) {
        requireAdmin();
        return orgUnitService.update(id, req);
    }

    @PatchMapping("/{id}/active")
    public OrgUnitResponse setActive(@PathVariable UUID id, @RequestParam boolean active) {
        requireAdmin();
        return orgUnitService.setActive(id, active);
    }

    private void requireAdmin() {
        if (!CurrentUser.get().isAdmin()) {
            throw new ForbiddenException("Administrators only.");
        }
    }
}
