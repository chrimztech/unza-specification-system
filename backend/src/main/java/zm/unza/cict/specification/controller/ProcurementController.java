package zm.unza.cict.specification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import zm.unza.cict.specification.dto.procurement.*;
import zm.unza.cict.specification.security.CurrentUser;
import zm.unza.cict.specification.service.ProcurementService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/requests/{requestId}")
@RequiredArgsConstructor
public class ProcurementController {

    private final ProcurementService procurementService;

    @GetMapping("/quotations")
    public List<QuotationResponse> listQuotations(@PathVariable UUID requestId) {
        return procurementService.listQuotations(requestId, CurrentUser.get());
    }

    @PostMapping("/quotations")
    public QuotationResponse addQuotation(@PathVariable UUID requestId, @Valid @RequestBody QuotationRequest req) {
        return procurementService.addQuotation(requestId, req, CurrentUser.get());
    }

    @PostMapping("/quotations/{quotationId}/evaluate")
    public EvaluationResponse evaluateQuotation(@PathVariable UUID requestId, @PathVariable UUID quotationId,
                                                 @Valid @RequestBody EvaluationRequest req) {
        return procurementService.evaluateQuotation(requestId, quotationId, req, CurrentUser.get());
    }

    @GetMapping("/purchase")
    public List<PurchaseResponse> listPurchases(@PathVariable UUID requestId) {
        return procurementService.listPurchases(requestId, CurrentUser.get());
    }

    @PostMapping("/purchase")
    public PurchaseResponse recordPurchase(@PathVariable UUID requestId, @Valid @RequestBody PurchaseRequest req) {
        return procurementService.recordPurchase(requestId, req, CurrentUser.get());
    }

    @GetMapping("/stores-receipt")
    public List<StoresReceiptResponse> listStoresReceipts(@PathVariable UUID requestId) {
        return procurementService.listStoresReceipts(requestId, CurrentUser.get());
    }

    @PostMapping("/stores-receipt")
    public StoresReceiptResponse recordStoresReceipt(@PathVariable UUID requestId, @RequestBody StoresReceiptRequest req) {
        return procurementService.recordStoresReceipt(requestId, req, CurrentUser.get());
    }

    @GetMapping("/verification")
    public List<VerificationResponse> listVerifications(@PathVariable UUID requestId) {
        return procurementService.listVerifications(requestId, CurrentUser.get());
    }

    @PostMapping("/verification")
    public VerificationResponse recordVerification(@PathVariable UUID requestId, @Valid @RequestBody VerificationRequest req) {
        return procurementService.recordVerification(requestId, req, CurrentUser.get());
    }

    @PostMapping("/restart-procurement")
    public void restartProcurement(@PathVariable UUID requestId) {
        procurementService.restartProcurement(requestId, CurrentUser.get());
    }
}
