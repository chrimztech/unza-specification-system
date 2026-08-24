package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.domain.Request;
import zm.unza.cict.specification.repository.DelegationRepository;
import zm.unza.cict.specification.security.AuthenticatedUser;

import java.time.Instant;
import java.util.UUID;

/** Replicates the visibility/edit rules the old Supabase RLS policies enforced on `requests`. */
@Service
@RequiredArgsConstructor
public class RequestAccessService {

    private final DelegationRepository delegationRepository;

    public boolean actsForManager(UUID userId, UUID managerId) {
        if (managerId == null) return false;
        return delegationRepository.actsFor(userId, managerId, Instant.now());
    }

    public boolean canView(AuthenticatedUser user, Request request) {
        if (user.isOversight()) return true;
        if (request.getRequester().getId().equals(user.id())) return true;
        if (request.getSubmittedBy().getId().equals(user.id())) return true;
        if (request.getManager() != null && request.getManager().getId().equals(user.id())) return true;
        return request.getManager() != null && actsForManager(user.id(), request.getManager().getId());
    }

    public boolean canEdit(AuthenticatedUser user, Request request) {
        if (user.isCict()) return true;
        if (request.getSubmittedBy().getId().equals(user.id())) return true;
        if (request.getRequester().getId().equals(user.id())) return true;
        if (request.getManager() != null && request.getManager().getId().equals(user.id())) return true;
        return request.getManager() != null && actsForManager(user.id(), request.getManager().getId());
    }

    public void assertCanView(AuthenticatedUser user, Request request) {
        if (!canView(user, request)) {
            throw new ForbiddenException("You do not have access to this request.");
        }
    }

    public void assertCanEdit(AuthenticatedUser user, Request request) {
        if (!canEdit(user, request)) {
            throw new ForbiddenException("You do not have permission to modify this request.");
        }
    }
}
