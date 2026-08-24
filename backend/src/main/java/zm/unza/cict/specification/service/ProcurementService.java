package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zm.unza.cict.specification.common.enums.RequestStatus;
import zm.unza.cict.specification.common.exception.BadRequestException;
import zm.unza.cict.specification.common.exception.ForbiddenException;
import zm.unza.cict.specification.common.exception.NotFoundException;
import zm.unza.cict.specification.domain.*;
import zm.unza.cict.specification.dto.procurement.*;
import zm.unza.cict.specification.dto.user.UserRefResponse;
import zm.unza.cict.specification.repository.*;
import zm.unza.cict.specification.security.AuthenticatedUser;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * The post-CICT-approval lifecycle: procurement sources quotations, each
 * quotation is evaluated (pass/fail, re-evaluatable on fail), a passing
 * quotation is purchased, stores logs receipt, and CICT Support verifies the
 * item before the request is considered complete (or flagged for return).
 */
@Service
@RequiredArgsConstructor
public class ProcurementService {

    private static final Set<RequestStatus> QUOTABLE = EnumSet.of(RequestStatus.APPROVED, RequestStatus.PROCUREMENT);

    private final RequestRepository requestRepository;
    private final RequestQuotationRepository quotationRepository;
    private final QuotationEvaluationRepository evaluationRepository;
    private final RequestPurchaseRepository purchaseRepository;
    private final RequestStoresReceiptRepository storesReceiptRepository;
    private final RequestVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final RequestAccessService accessService;
    private final ReferenceNumberService referenceNumberService;
    private final RequestEventService eventService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public QuotationResponse addQuotation(UUID requestId, QuotationRequest req, AuthenticatedUser actor) {
        requireRole(actor, "procurement", "Only procurement staff can add quotations.");
        Request request = loadRequest(requestId);
        if (!QUOTABLE.contains(request.getStatus())) {
            throw new BadRequestException("Quotations can only be added once CICT has approved the specification.");
        }
        RequestStatus from = request.getStatus();

        RequestQuotation quotation = RequestQuotation.builder()
                .request(request)
                .vendorName(req.vendorName())
                .amount(req.amount())
                .currency(req.currency() != null && !req.currency().isBlank() ? req.currency() : "ZMW")
                .notes(req.notes())
                .submittedBy(userRepository.getReferenceById(actor.id()))
                .build();
        quotation = quotationRepository.save(quotation);

        if (from == RequestStatus.APPROVED) {
            request.setStatus(RequestStatus.PROCUREMENT);
            eventService.log(request, actor.id(), actor.email(), "Sent to procurement for quotations",
                    from, request.getStatus(), null);
            notificationService.notifyStatusChange(request, from, actor.id());
        }
        auditLogService.log("RequestQuotation", quotation.getId().toString(), "create",
                "Quotation from " + req.vendorName() + " (" + quotation.getCurrency() + " " + req.amount()
                        + ") on " + request.getReference());
        return toResponse(quotation);
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> listQuotations(UUID requestId, AuthenticatedUser actor) {
        accessService.assertCanView(actor, loadRequest(requestId));
        return quotationRepository.findByRequestIdOrderByCreatedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EvaluationResponse evaluateQuotation(UUID requestId, UUID quotationId, EvaluationRequest req, AuthenticatedUser actor) {
        requireRole(actor, "procurement", "Only procurement staff can evaluate quotations.");
        RequestQuotation quotation = loadQuotation(requestId, quotationId);
        if (quotation.getRequest().getStatus() != RequestStatus.PROCUREMENT) {
            throw new BadRequestException("This request is not currently in procurement.");
        }
        String result = normaliseResult(req.result(), "pass", "fail");
        if (result.equals("fail")) requireNote(req.notes());

        QuotationEvaluation evaluation = QuotationEvaluation.builder()
                .reference(referenceNumberService.next("EVAL"))
                .quotation(quotation)
                .result(result)
                .notes(req.notes())
                .evaluatedBy(userRepository.getReferenceById(actor.id()))
                .build();
        evaluation = evaluationRepository.save(evaluation);

        eventService.log(quotation.getRequest(), actor.id(), actor.email(),
                "Quotation from " + quotation.getVendorName() + " evaluated: " + result,
                null, null, req.notes());
        auditLogService.log("QuotationEvaluation", evaluation.getId().toString(), result,
                evaluation.getReference() + " - " + quotation.getVendorName());
        return toResponse(evaluation);
    }

    @Transactional
    public PurchaseResponse recordPurchase(UUID requestId, PurchaseRequest req, AuthenticatedUser actor) {
        requireRole(actor, "procurement", "Only procurement staff can record a purchase.");
        Request request = loadRequest(requestId);
        if (request.getStatus() != RequestStatus.PROCUREMENT) {
            throw new BadRequestException("This request is not currently in procurement.");
        }
        RequestQuotation quotation = loadQuotation(requestId, req.quotationId());
        boolean passed = evaluationRepository.findByQuotationIdOrderByEvaluatedAtDesc(quotation.getId()).stream()
                .findFirst()
                .map(e -> "pass".equals(e.getResult()))
                .orElse(false);
        if (!passed) {
            throw new BadRequestException("Only a quotation with a passing evaluation can be purchased.");
        }

        RequestPurchase purchase = RequestPurchase.builder()
                .request(request)
                .quotation(quotation)
                .purchaseOrderNumber(req.purchaseOrderNumber())
                .vendorName(req.vendorName())
                .amount(req.amount())
                .currency(req.currency() != null && !req.currency().isBlank() ? req.currency() : "ZMW")
                .purchasedBy(userRepository.getReferenceById(actor.id()))
                .notes(req.notes())
                .build();
        purchase = purchaseRepository.save(purchase);

        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.PURCHASED);
        eventService.log(request, actor.id(), actor.email(), "Purchase recorded", from, request.getStatus(), req.notes());
        notificationService.notifyStatusChange(request, from, actor.id());
        auditLogService.log("RequestPurchase", purchase.getId().toString(), "create",
                "Purchased from " + req.vendorName() + " for " + request.getReference());
        return toResponse(purchase);
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> listPurchases(UUID requestId, AuthenticatedUser actor) {
        accessService.assertCanView(actor, loadRequest(requestId));
        return purchaseRepository.findByRequestIdOrderByPurchasedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StoresReceiptResponse recordStoresReceipt(UUID requestId, StoresReceiptRequest req, AuthenticatedUser actor) {
        requireRole(actor, "stores", "Only stores staff can record a stores receipt.");
        Request request = loadRequest(requestId);
        if (request.getStatus() != RequestStatus.PURCHASED) {
            throw new BadRequestException("This request has not been purchased yet.");
        }
        RequestPurchase purchase = purchaseRepository.findFirstByRequestIdOrderByPurchasedAtDesc(requestId).orElse(null);

        RequestStoresReceipt receipt = RequestStoresReceipt.builder()
                .request(request)
                .purchase(purchase)
                .receivedBy(userRepository.getReferenceById(actor.id()))
                .conditionNotes(req.conditionNotes())
                .build();
        receipt = storesReceiptRepository.save(receipt);

        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.IN_STORES);
        eventService.log(request, actor.id(), actor.email(), "Received into stores", from, request.getStatus(), req.conditionNotes());
        notificationService.notifyStatusChange(request, from, actor.id());
        auditLogService.log("RequestStoresReceipt", receipt.getId().toString(), "create", "Received for " + request.getReference());
        return toResponse(receipt);
    }

    @Transactional(readOnly = true)
    public List<StoresReceiptResponse> listStoresReceipts(UUID requestId, AuthenticatedUser actor) {
        accessService.assertCanView(actor, loadRequest(requestId));
        return storesReceiptRepository.findByRequestIdOrderByReceivedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public VerificationResponse recordVerification(UUID requestId, VerificationRequest req, AuthenticatedUser actor) {
        requireRole(actor, "cict_support", "Only CICT Support can verify items.");
        Request request = loadRequest(requestId);
        if (request.getStatus() != RequestStatus.IN_STORES) {
            throw new BadRequestException("This request is not awaiting verification.");
        }
        String result = normaliseResult(req.result(), "pass", "needs_return");
        if (result.equals("needs_return")) requireNote(req.notes());
        RequestStoresReceipt receipt = storesReceiptRepository.findFirstByRequestIdOrderByReceivedAtDesc(requestId).orElse(null);

        RequestVerification verification = RequestVerification.builder()
                .reference(referenceNumberService.next("VERIFY"))
                .request(request)
                .storesReceipt(receipt)
                .result(result)
                .notes(req.notes())
                .verifiedBy(userRepository.getReferenceById(actor.id()))
                .build();
        verification = verificationRepository.save(verification);

        RequestStatus from = request.getStatus();
        request.setStatus(result.equals("pass") ? RequestStatus.COMPLETED : RequestStatus.RETURN_REQUIRED);
        eventService.log(request, actor.id(), actor.email(),
                result.equals("pass")
                        ? "CICT Support verified the item matches specification"
                        : "CICT Support flagged the item for return",
                from, request.getStatus(), req.notes());
        notificationService.notifyStatusChange(request, from, actor.id());
        auditLogService.log("RequestVerification", verification.getId().toString(), result,
                verification.getReference() + " on " + request.getReference());
        return toResponse(verification);
    }

    @Transactional(readOnly = true)
    public List<VerificationResponse> listVerifications(UUID requestId, AuthenticatedUser actor) {
        accessService.assertCanView(actor, loadRequest(requestId));
        return verificationRepository.findByRequestIdOrderByVerifiedAtDesc(requestId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void restartProcurement(UUID requestId, AuthenticatedUser actor) {
        requireRole(actor, "procurement", "Only procurement staff can restart procurement.");
        Request request = loadRequest(requestId);
        if (request.getStatus() != RequestStatus.RETURN_REQUIRED) {
            throw new BadRequestException("This request is not awaiting a procurement restart.");
        }
        RequestStatus from = request.getStatus();
        request.setStatus(RequestStatus.PROCUREMENT);
        eventService.log(request, actor.id(), actor.email(), "Procurement restarted after return",
                from, request.getStatus(), null);
        notificationService.notifyStatusChange(request, from, actor.id());
        auditLogService.log("Request", request.getId().toString(), "restart_procurement", request.getReference());
    }

    private void requireRole(AuthenticatedUser actor, String role, String message) {
        if (!actor.hasRole(role) && !actor.isAdmin()) {
            throw new ForbiddenException(message);
        }
    }

    private String normaliseResult(String value, String... allowed) {
        String v = value != null ? value.trim().toLowerCase() : "";
        for (String a : allowed) {
            if (a.equals(v)) return v;
        }
        throw new BadRequestException("Unknown result: " + value);
    }

    private void requireNote(String note) {
        if (note == null || note.trim().isEmpty()) {
            throw new BadRequestException("Please record a reason for this outcome.");
        }
    }

    private Request loadRequest(UUID id) {
        return requestRepository.findById(id).orElseThrow(() -> new NotFoundException("Request not found."));
    }

    private RequestQuotation loadQuotation(UUID requestId, UUID quotationId) {
        RequestQuotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new NotFoundException("Quotation not found."));
        if (!quotation.getRequest().getId().equals(requestId)) {
            throw new NotFoundException("Quotation not found.");
        }
        return quotation;
    }

    private QuotationResponse toResponse(RequestQuotation q) {
        List<EvaluationResponse> evaluations = evaluationRepository.findByQuotationIdOrderByEvaluatedAtDesc(q.getId()).stream()
                .map(this::toResponse)
                .toList();
        return new QuotationResponse(
                q.getId(), q.getRequest().getId(), q.getVendorName(), q.getAmount(), q.getCurrency(), q.getNotes(),
                toUserRef(q.getSubmittedBy()), q.getCreatedAt(), evaluations
        );
    }

    private EvaluationResponse toResponse(QuotationEvaluation e) {
        return new EvaluationResponse(
                e.getId(), e.getReference(), e.getQuotation().getId(), e.getResult(), e.getNotes(),
                toUserRef(e.getEvaluatedBy()), e.getEvaluatedAt()
        );
    }

    private PurchaseResponse toResponse(RequestPurchase p) {
        return new PurchaseResponse(
                p.getId(), p.getRequest().getId(), p.getQuotation() != null ? p.getQuotation().getId() : null,
                p.getPurchaseOrderNumber(), p.getVendorName(), p.getAmount(), p.getCurrency(),
                toUserRef(p.getPurchasedBy()), p.getPurchasedAt(), p.getNotes()
        );
    }

    private StoresReceiptResponse toResponse(RequestStoresReceipt r) {
        return new StoresReceiptResponse(
                r.getId(), r.getRequest().getId(), r.getPurchase() != null ? r.getPurchase().getId() : null,
                toUserRef(r.getReceivedBy()), r.getReceivedAt(), r.getConditionNotes()
        );
    }

    private VerificationResponse toResponse(RequestVerification v) {
        return new VerificationResponse(
                v.getId(), v.getReference(), v.getRequest().getId(),
                v.getStoresReceipt() != null ? v.getStoresReceipt().getId() : null,
                v.getResult(), v.getNotes(), toUserRef(v.getVerifiedBy()), v.getVerifiedAt()
        );
    }

    private UserRefResponse toUserRef(User user) {
        if (user == null) return null;
        return new UserRefResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}
