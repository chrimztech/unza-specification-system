package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.Delegation;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.dto.delegation.DelegationRequest;
import zm.unza.cict.specification.dto.delegation.DelegationResponse;
import zm.unza.cict.specification.dto.user.UserRefResponse;
import zm.unza.cict.specification.repository.DelegationRepository;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.security.AuthenticatedUser;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DelegationService {

    private final DelegationRepository delegationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DelegationResponse> listMine(AuthenticatedUser user) {
        return delegationRepository.findByDelegatorIdOrDelegateIdOrderByCreatedAtDesc(user.id(), user.id()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DelegationResponse create(DelegationRequest req, AuthenticatedUser actor) {
        if (req.delegateId().equals(actor.id())) {
            throw new BadRequestException("You cannot delegate to yourself.");
        }
        User delegator = userRepository.findById(actor.id()).orElseThrow(() -> new NotFoundException("User not found."));
        User delegate = userRepository.findById(req.delegateId()).orElseThrow(() -> new NotFoundException("Delegate not found."));
        Delegation delegation = Delegation.builder()
                .delegator(delegator)
                .delegate(delegate)
                .reason(req.reason())
                .createdBy(delegator)
                .build();
        if (req.startsAt() != null) delegation.setStartsAt(req.startsAt());
        if (req.endsAt() != null) delegation.setEndsAt(req.endsAt());
        delegation = delegationRepository.save(delegation);
        auditLogService.log("Delegation", delegation.getId().toString(), "create",
                delegator.getEmail() + " delegated to " + delegate.getEmail());
        return toResponse(delegation);
    }

    @Transactional
    public void deactivate(UUID id, AuthenticatedUser actor) {
        Delegation delegation = delegationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Delegation not found."));
        if (!delegation.getDelegator().getId().equals(actor.id()) && !actor.isAdmin()) {
            throw new ForbiddenException("Only the delegator or an administrator can change this delegation.");
        }
        delegation.setActive(false);
        auditLogService.log("Delegation", delegation.getId().toString(), "deactivate",
                delegation.getDelegator().getEmail() + " -> " + delegation.getDelegate().getEmail());
    }

    private DelegationResponse toResponse(Delegation d) {
        return new DelegationResponse(
                d.getId(),
                new UserRefResponse(d.getDelegator().getId(), d.getDelegator().getFullName(), d.getDelegator().getEmail()),
                new UserRefResponse(d.getDelegate().getId(), d.getDelegate().getFullName(), d.getDelegate().getEmail()),
                d.getReason(), d.getStartsAt(), d.getEndsAt(), d.isActive(), d.getCreatedAt()
        );
    }
}
