package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.RequestStatus;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.*;
import zm.unza.cict.specification.dto.request.*;
import zm.unza.cict.specification.dto.user.UserRefResponse;
import zm.unza.cict.specification.repository.*;
import zm.unza.cict.specification.security.AuthenticatedUser;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RequestService {

    private static final UUID NIL_UUID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final Set<RequestStatus> WITHDRAWABLE = EnumSet.of(
            RequestStatus.DRAFT, RequestStatus.PENDING_MANAGER, RequestStatus.PENDING_CICT, RequestStatus.NEEDS_CLARIFICATION);

    private final RequestRepository requestRepository;
    private final RequestItemRepository requestItemRepository;
    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final EquipmentCategoryRepository categoryRepository;
    private final SpecProfileRepository specProfileRepository;
    private final SpecProfileService specProfileService;
    private final DelegationRepository delegationRepository;
    private final RequestAccessService accessService;
    private final RequestEventService eventService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<RequestResponse> listVisible(AuthenticatedUser user) {
        List<UUID> delegatedManagerIds = delegationRepository.findActiveDelegatorIdsFor(user.id(), Instant.now());
        if (delegatedManagerIds.isEmpty()) delegatedManagerIds = List.of(NIL_UUID);
        return requestRepository.findVisibleForUser(user.id(), user.isOversight(), delegatedManagerIds).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RequestResponse get(UUID id, AuthenticatedUser user) {
        Request request = loadWithItems(id);
        accessService.assertCanView(user, request);
        return toResponse(request);
    }

    @Transactional
    public RequestResponse create(RequestUpsertRequest req, boolean submit, AuthenticatedUser actor) {
        User requester = userRepository.findById(actor.id())
                .orElseThrow(() -> new NotFoundException("User not found."));

        String reference = req.reference() != null ? req.reference().trim() : "";
        if (reference.isEmpty()) {
            throw new BadRequestException(
                    "Enter the CICT Help Desk ticket number for this request. Raise a ticket with the Help Desk first if you don't have one yet.");
        }
        if (requestRepository.existsByReference(reference)) {
            throw new BadRequestException("This Help Desk reference has already been used for another request.");
        }

        Request request = Request.builder()
                .reference(reference)
                .requester(requester)
                .submittedBy(requester)
                .build();
        applyFields(request, req);

        if (submit) {
            validateForSubmission(request, req);
            request.setStatus(RequestStatus.PENDING_MANAGER);
            request.setSubmittedAt(Instant.now());
        } else {
            request.setStatus(RequestStatus.DRAFT);
        }
        request = requestRepository.save(request);
        replaceItems(request, req.items(), effectivePositionLevel(request));

        eventService.log(request, actor.id(), actor.email(),
                submit ? "Request submitted for manager approval" : "Draft saved",
                null, request.getStatus(), null);

        return toResponse(loadWithItems(request.getId()));
    }

    @Transactional
    public RequestResponse update(UUID id, RequestUpsertRequest req, boolean submit, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        accessService.assertCanEdit(actor, request);
        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new BadRequestException("Only draft requests can be edited.");
        }

        if (req.reference() != null) {
            String reference = req.reference().trim();
            if (reference.isEmpty()) {
                throw new BadRequestException("Enter the CICT Help Desk ticket number for this request.");
            }
            if (!reference.equalsIgnoreCase(request.getReference()) && requestRepository.existsByReference(reference)) {
                throw new BadRequestException("This Help Desk reference has already been used for another request.");
            }
            request.setReference(reference);
        }

        applyFields(request, req);

        if (submit) {
            validateForSubmission(request, req);
            request.setStatus(RequestStatus.PENDING_MANAGER);
            request.setSubmittedAt(Instant.now());
        }
        replaceItems(request, req.items(), effectivePositionLevel(request));

        eventService.log(request, actor.id(), actor.email(),
                submit ? "Request submitted for manager approval" : "Draft updated",
                RequestStatus.DRAFT, request.getStatus(), null);

        return toResponse(loadWithItems(request.getId()));
    }

    @Transactional
    public void deleteDraft(UUID id, AuthenticatedUser actor) {
        Request request = requestRepository.findById(id).orElseThrow(() -> new NotFoundException("Request not found."));
        if (!request.getSubmittedBy().getId().equals(actor.id())) {
            throw new ForbiddenException("Only the person who submitted this draft can delete it.");
        }
        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new BadRequestException("Only draft requests can be deleted.");
        }
        requestRepository.delete(request);
    }

    @Transactional
    public RequestResponse submit(UUID id, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        accessService.assertCanEdit(actor, request);
        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new BadRequestException("Only draft requests can be submitted.");
        }
        if (request.getManager() == null) {
            throw new BadRequestException("Choose an approving manager before submitting.");
        }
        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.PENDING_MANAGER);
        request.setSubmittedAt(Instant.now());
        eventService.log(request, actor.id(), actor.email(), "Request submitted for manager approval",
                from, request.getStatus(), null);
        notificationService.notifyStatusChange(request, from, actor.id());
        return toResponse(request);
    }

    @Transactional
    public RequestResponse withdraw(UUID id, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        boolean isRequester = request.getRequester().getId().equals(actor.id())
                || request.getSubmittedBy().getId().equals(actor.id());
        if (!isRequester) {
            throw new ForbiddenException("Only the requester can withdraw this request.");
        }
        if (!WITHDRAWABLE.contains(request.getStatus())) {
            throw new BadRequestException("This request can no longer be withdrawn.");
        }
        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.WITHDRAWN);
        eventService.log(request, actor.id(), actor.email(), "Requester withdrew the request", from, request.getStatus(), null);
        notificationService.notifyStatusChange(request, from, actor.id());
        return toResponse(request);
    }

    @Transactional
    public RequestResponse respondToClarification(UUID id, String note, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        boolean isRequester = request.getRequester().getId().equals(actor.id())
                || request.getSubmittedBy().getId().equals(actor.id());
        if (!isRequester) {
            throw new ForbiddenException("Only the requester can respond to this request.");
        }
        if (request.getStatus() != RequestStatus.NEEDS_CLARIFICATION) {
            throw new BadRequestException("This request is not awaiting clarification.");
        }
        requireNote(note);
        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.PENDING_CICT);
        eventService.log(request, actor.id(), actor.email(),
                "Requester responded to the clarification request", from, request.getStatus(), note.trim());
        notificationService.notifyStatusChange(request, from, actor.id());
        return toResponse(request);
    }

    @Transactional
    public RequestResponse managerDecision(UUID id, RequestDecisionRequest req, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        boolean isManager = request.getManager() != null && request.getManager().getId().equals(actor.id());
        boolean isDelegate = request.getManager() != null && accessService.actsForManager(actor.id(), request.getManager().getId());
        if (!isManager && !isDelegate) {
            throw new ForbiddenException("Only the assigned manager can decide on this request.");
        }
        if (request.getStatus() != RequestStatus.PENDING_MANAGER) {
            throw new BadRequestException("This request is not awaiting manager approval.");
        }

        RequestStatus from = request.getStatus();
        String note = req.note() != null ? req.note().trim() : null;
        switch (req.decision()) {
            case "approved" -> {
                request.setStatus(RequestStatus.PENDING_CICT);
                request.setManagerDecidedAt(Instant.now());
                request.setManagerDecisionNote(note);
                eventService.log(request, actor.id(), actor.email(), "Manager approved the business need",
                        from, request.getStatus(), note);
            }
            case "rejected" -> {
                requireNote(req.note());
                request.setStatus(RequestStatus.REJECTED);
                request.setManagerDecidedAt(Instant.now());
                request.setManagerDecisionNote(note);
                eventService.log(request, actor.id(), actor.email(), "Manager rejected the request",
                        from, request.getStatus(), note);
            }
            case "returned" -> {
                requireNote(req.note());
                request.setStatus(RequestStatus.DRAFT);
                eventService.log(request, actor.id(), actor.email(), "Returned to requester for correction",
                        from, request.getStatus(), note);
            }
            default -> throw new BadRequestException("Unknown decision: " + req.decision());
        }
        notificationService.notifyStatusChange(request, from, actor.id());
        return toResponse(request);
    }

    @Transactional
    public RequestResponse cictDecision(UUID id, RequestDecisionRequest req, AuthenticatedUser actor) {
        Request request = loadWithItems(id);
        if (!actor.isCict()) {
            throw new ForbiddenException("Only CICT reviewers can decide on this request.");
        }
        if (request.getStatus() != RequestStatus.PENDING_CICT && request.getStatus() != RequestStatus.NEEDS_CLARIFICATION) {
            throw new BadRequestException("This request is not awaiting CICT review.");
        }

        RequestStatus from = request.getStatus();
        String note = req.note() != null ? req.note().trim() : null;
        switch (req.decision()) {
            case "approved" -> {
                applyItemDecisions(request, req.itemDecisions());
                request.setStatus(RequestStatus.APPROVED);
                request.setCictDecidedAt(Instant.now());
                request.setCictDecidedBy(userRepository.getReferenceById(actor.id()));
                request.setCictDecisionNote(note);
                eventService.log(request, actor.id(), actor.email(), "CICT approved the technical specification",
                        from, request.getStatus(), note);
            }
            case "needs_clarification" -> {
                requireNote(req.note());
                request.setStatus(RequestStatus.NEEDS_CLARIFICATION);
                eventService.log(request, actor.id(), actor.email(), "CICT requested clarification",
                        from, request.getStatus(), note);
            }
            case "rejected" -> {
                requireNote(req.note());
                request.setStatus(RequestStatus.REJECTED);
                request.setCictDecidedAt(Instant.now());
                request.setCictDecidedBy(userRepository.getReferenceById(actor.id()));
                request.setCictDecisionNote(note);
                eventService.log(request, actor.id(), actor.email(), "CICT rejected the request",
                        from, request.getStatus(), note);
            }
            default -> throw new BadRequestException("Unknown decision: " + req.decision());
        }
        notificationService.notifyStatusChange(request, from, actor.id());
        return toResponse(loadWithItems(request.getId()));
    }

    private void applyItemDecisions(Request request, List<RequestItemReviewRequest> decisions) {
        Map<UUID, RequestItemReviewRequest> byItemId = new HashMap<>();
        if (decisions != null) {
            decisions.forEach(d -> byItemId.put(d.itemId(), d));
        }
        for (RequestItem item : request.getItems()) {
            RequestItemReviewRequest chosen = byItemId.get(item.getId());
            UUID profileId = chosen != null && chosen.approvedProfileId() != null
                    ? chosen.approvedProfileId()
                    : (item.getRecommendedProfile() != null ? item.getRecommendedProfile().getId() : null);
            if (profileId != null) {
                SpecProfile profile = specProfileRepository.findById(profileId).orElse(null);
                item.setApprovedProfile(profile);
                if (chosen != null && chosen.approvedSpecSnapshot() != null) {
                    item.setApprovedSpecSnapshot(chosen.approvedSpecSnapshot());
                } else if (profile != null) {
                    item.setApprovedSpecSnapshot(Map.of(
                            "name", profile.getName(), "tier", profile.getTier(), "specs", profile.getSpecs()));
                }
            }
            if (chosen != null) {
                if (chosen.exceptionJustification() != null) item.setExceptionJustification(chosen.exceptionJustification());
                if (chosen.reviewerNote() != null) item.setReviewerNote(chosen.reviewerNote());
            }
        }
    }

    private void requireNote(String note) {
        if (note == null || note.trim().isEmpty()) {
            throw new BadRequestException("Please record a reason for this decision.");
        }
    }

    private void validateForSubmission(Request request, RequestUpsertRequest req) {
        if (request.getTitle() == null || request.getTitle().trim().length() < 3) {
            throw new BadRequestException("Add a descriptive request title.");
        }
        if (request.getJustification() == null || request.getJustification().trim().length() < 10) {
            throw new BadRequestException("Give a business justification.");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new BadRequestException("Add at least one equipment item.");
        }
        if (request.getManager() == null) {
            throw new BadRequestException("Choose the approving manager.");
        }
    }

    private void applyFields(Request request, RequestUpsertRequest req) {
        if (req.title() != null) request.setTitle(req.title());
        if (req.onBehalfOfId() != null) {
            User onBehalfOf = userRepository.findById(req.onBehalfOfId())
                    .orElseThrow(() -> new NotFoundException("Selected staff member not found."));
            request.setOnBehalfOf(onBehalfOf);
            request.setRequestedFor(onBehalfOf.getFullName());
        } else if (req.requestedFor() != null) {
            request.setOnBehalfOf(null);
            request.setRequestedFor(req.requestedFor());
        }
        if (req.orgUnitId() != null) {
            request.setOrgUnit(orgUnitRepository.findById(req.orgUnitId())
                    .orElseThrow(() -> new NotFoundException("Org unit not found.")));
        }
        if (req.orgUnitName() != null) request.setOrgUnitName(req.orgUnitName());
        if (req.managerId() != null) {
            request.setManager(userRepository.findById(req.managerId())
                    .orElseThrow(() -> new NotFoundException("Manager not found.")));
        }
        if (req.justification() != null) request.setJustification(req.justification());
        if (req.requestType() != null) request.setRequestType(req.requestType());
        if (req.businessContext() != null) request.setBusinessContext(req.businessContext());
        if (req.impactIfNotProvided() != null) request.setImpactIfNotProvided(req.impactIfNotProvided());
        if (req.priority() != null) request.setPriority(req.priority());
        if (req.priorityReason() != null) request.setPriorityReason(req.priorityReason());
        if (req.requiredBy() != null) request.setRequiredBy(req.requiredBy());
        if (req.fundingSource() != null) request.setFundingSource(req.fundingSource());
        if (req.costCentre() != null) request.setCostCentre(req.costCentre());
        if (req.budgetStatus() != null) request.setBudgetStatus(req.budgetStatus());
        if (req.estimatedBudget() != null) request.setEstimatedBudget(req.estimatedBudget());
        if (req.existingAssetTag() != null) request.setExistingAssetTag(req.existingAssetTag());
        if (req.existingAssetDetails() != null) request.setExistingAssetDetails(req.existingAssetDetails());
        if (req.replacementReason() != null) request.setReplacementReason(req.replacementReason());
        if (Boolean.TRUE.equals(req.declarationAccepted())) {
            request.setDeclarationAccepted(true);
            request.setDeclarationAt(Instant.now());
        }
    }

    private void replaceItems(Request request, List<RequestItemRequest> items, String positionLevel) {
        if (items == null) return;
        Set<UUID> keepIds = new HashSet<>();
        int order = 0;
        for (RequestItemRequest itemReq : items) {
            RequestItem item = itemReq.id() != null
                    ? request.getItems().stream().filter(i -> i.getId().equals(itemReq.id())).findFirst().orElse(null)
                    : null;
            if (item == null) {
                item = RequestItem.builder().request(request).build();
                request.getItems().add(item);
            }
            EquipmentCategory category = itemReq.categoryId() != null
                    ? categoryRepository.findById(itemReq.categoryId()).orElse(null)
                    : null;
            item.setCategory(category);
            item.setQuantity(itemReq.quantity() != null ? itemReq.quantity() : 1);
            item.setIntendedUsers(itemReq.intendedUsers());
            item.setLocation(itemReq.location());
            item.setShared(Boolean.TRUE.equals(itemReq.isShared()));
            item.setPurpose(itemReq.purpose());
            item.setRequiredSoftware(itemReq.requiredSoftware());
            item.setProposedSpec(itemReq.proposedSpec());
            item.setSortOrder(itemReq.sortOrder() != null ? itemReq.sortOrder() : order);

            SpecProfile recommended = category != null
                    ? specProfileService.recommend(category.getId(), positionLevel)
                    : null;
            item.setRecommendedProfile(recommended);

            keepIds.add(item.getId());
            order++;
        }
        request.getItems().removeIf(i -> i.getId() != null && !keepIds.contains(i.getId()));
    }

    /** Spec recommendations follow the actual end-user's position level when the request is on someone else's behalf. */
    private String effectivePositionLevel(Request request) {
        return request.getOnBehalfOf() != null
                ? request.getOnBehalfOf().getPositionLevel()
                : request.getRequester().getPositionLevel();
    }

    private Request loadWithItems(UUID id) {
        return requestRepository.findWithItemsById(id).orElseThrow(() -> new NotFoundException("Request not found."));
    }

    public RequestResponse toResponse(Request r) {
        List<RequestItemResponse> items = r.getItems().stream()
                .sorted(Comparator.comparingInt(RequestItem::getSortOrder))
                .map(this::toItemResponse)
                .toList();
        return new RequestResponse(
                r.getId(), r.getReference(), toUserRef(r.getRequester()), toUserRef(r.getSubmittedBy()),
                r.getRequestedFor(), toUserRef(r.getOnBehalfOf()),
                r.getOrgUnit() != null ? new zm.unza.cict.specification.dto.orgunit.OrgUnitResponse(
                        r.getOrgUnit().getId(), r.getOrgUnit().getCode(), r.getOrgUnit().getName(),
                        r.getOrgUnit().getUnitType(),
                        r.getOrgUnit().getParent() != null ? r.getOrgUnit().getParent().getId() : null,
                        r.getOrgUnit().getCampus(), r.getOrgUnit().isActive(), r.getOrgUnit().getCreatedAt()) : null,
                r.getOrgUnitName(), toUserRef(r.getManager()), r.getTitle(), r.getJustification(),
                r.getRequestType(), r.getBusinessContext(), r.getImpactIfNotProvided(), r.getPriority(),
                r.getPriorityReason(), r.getRequiredBy(), r.getFundingSource(), r.getCostCentre(),
                r.getBudgetStatus(), r.getEstimatedBudget(), r.getExistingAssetTag(), r.getExistingAssetDetails(),
                r.getReplacementReason(), r.isDeclarationAccepted(), r.getDeclarationAt(),
                r.getStatus().dbValue(), r.getManagerDecisionNote(), r.getManagerDecidedAt(),
                r.getCictDecisionNote(), toUserRef(r.getCictDecidedBy()), r.getCictDecidedAt(),
                r.getSubmittedAt(), r.getCreatedAt(), r.getUpdatedAt(), items
        );
    }

    private RequestItemResponse toItemResponse(RequestItem item) {
        return new RequestItemResponse(
                item.getId(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getCategory() != null ? item.getCategory().getCode() : null,
                item.getCategory() != null ? item.getCategory().getName() : null,
                item.getQuantity(), item.getIntendedUsers(), item.getLocation(), item.isShared(),
                item.getPurpose(), item.getRequiredSoftware(), item.getProposedSpec(),
                specProfileService.toResponse(item.getRecommendedProfile()),
                specProfileService.toResponse(item.getApprovedProfile()),
                item.getApprovedSpecSnapshot(), item.getExceptionJustification(), item.getReviewerNote(),
                item.getSortOrder()
        );
    }

    private UserRefResponse toUserRef(User user) {
        if (user == null) return null;
        return new UserRefResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}
