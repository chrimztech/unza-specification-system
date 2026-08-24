package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.dto.request.*;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.RequestEventService;
import zm.unza.cict.specification.service.RequestService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;
    private final RequestEventService requestEventService;

    @GetMapping
    public List<RequestResponse> list() {
        return requestService.listVisible(CurrentUser.get());
    }

    @GetMapping("/{id}")
    public RequestResponse get(@PathVariable UUID id) {
        return requestService.get(id, CurrentUser.get());
    }

    @PostMapping
    public RequestResponse create(@Valid @RequestBody RequestUpsertRequest req,
                                   @RequestParam(defaultValue = "false") boolean submit) {
        return requestService.create(req, submit, CurrentUser.get());
    }

    @PutMapping("/{id}")
    public RequestResponse update(@PathVariable UUID id, @Valid @RequestBody RequestUpsertRequest req,
                                   @RequestParam(defaultValue = "false") boolean submit) {
        return requestService.update(id, req, submit, CurrentUser.get());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requestService.deleteDraft(id, CurrentUser.get());
    }

    @PostMapping("/{id}/submit")
    public RequestResponse submit(@PathVariable UUID id) {
        return requestService.submit(id, CurrentUser.get());
    }

    @PostMapping("/{id}/withdraw")
    public RequestResponse withdraw(@PathVariable UUID id) {
        return requestService.withdraw(id, CurrentUser.get());
    }

    @PostMapping("/{id}/respond-clarification")
    public RequestResponse respondToClarification(@PathVariable UUID id, @RequestBody RequestEventCreateRequest req) {
        return requestService.respondToClarification(id, req.comment(), CurrentUser.get());
    }

    @PostMapping("/{id}/manager-decision")
    public RequestResponse managerDecision(@PathVariable UUID id, @Valid @RequestBody RequestDecisionRequest req) {
        return requestService.managerDecision(id, req, CurrentUser.get());
    }

    @PostMapping("/{id}/cict-decision")
    public RequestResponse cictDecision(@PathVariable UUID id, @Valid @RequestBody RequestDecisionRequest req) {
        return requestService.cictDecision(id, req, CurrentUser.get());
    }

    @GetMapping("/{id}/events")
    public List<RequestEventResponse> events(@PathVariable UUID id) {
        requestService.get(id, CurrentUser.get());
        return requestEventService.list(id);
    }
}
