package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.dto.lookup.LookupValueRequest;
import zm.unza.cict.specification.dto.lookup.LookupValueResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.LookupValueService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lookup-values")
@RequiredArgsConstructor
public class LookupValueController {

    private final LookupValueService lookupValueService;

    @GetMapping
    public List<LookupValueResponse> list(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return lookupValueService.list(includeInactive);
    }

    @PostMapping
    public LookupValueResponse create(@Valid @RequestBody LookupValueRequest req) {
        requireAdmin();
        return lookupValueService.create(req);
    }

    @PutMapping("/{id}")
    public LookupValueResponse update(@PathVariable UUID id, @Valid @RequestBody LookupValueRequest req) {
        requireAdmin();
        return lookupValueService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requireAdmin();
        lookupValueService.delete(id);
    }

    private void requireAdmin() {
        if (!CurrentUser.get().isAdmin()) {
            throw new ForbiddenException("Administrators only.");
        }
    }
}
