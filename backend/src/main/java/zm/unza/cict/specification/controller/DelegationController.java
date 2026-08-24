package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.dto.delegation.DelegationRequest;
import zm.unza.cict.specification.dto.delegation.DelegationResponse;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.DelegationService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/delegations")
@RequiredArgsConstructor
public class DelegationController {

    private final DelegationService delegationService;

    @GetMapping
    public List<DelegationResponse> listMine() {
        return delegationService.listMine(CurrentUser.get());
    }

    @PostMapping
    public DelegationResponse create(@Valid @RequestBody DelegationRequest req) {
        return delegationService.create(req, CurrentUser.get());
    }

    @PostMapping("/{id}/deactivate")
    public void deactivate(@PathVariable UUID id) {
        delegationService.deactivate(id, CurrentUser.get());
    }
}
