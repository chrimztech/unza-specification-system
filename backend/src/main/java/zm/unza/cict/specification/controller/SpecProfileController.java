package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.catalogue.SpecProfileRequest;
import zm.unza.cict.specification.dto.catalogue.SpecProfileResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.SpecProfileService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/spec-profiles")
@RequiredArgsConstructor
public class SpecProfileController {

    private final SpecProfileService specProfileService;

    @GetMapping
    public List<SpecProfileResponse> list() {
        return specProfileService.list();
    }

    @PostMapping
    public SpecProfileResponse create(@Valid @RequestBody SpecProfileRequest req) {
        requireCict();
        return specProfileService.create(req);
    }

    @PutMapping("/{id}")
    public SpecProfileResponse update(@PathVariable UUID id, @Valid @RequestBody SpecProfileRequest req) {
        requireCict();
        return specProfileService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requireCict();
        specProfileService.delete(id);
    }

    private void requireCict() {
        if (!CurrentUser.get().isCict()) {
            throw new ForbiddenException("CICT staff only.");
        }
    }
}
