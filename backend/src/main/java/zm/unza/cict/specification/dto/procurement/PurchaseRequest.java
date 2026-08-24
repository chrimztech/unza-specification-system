package zm.unza.cict.specification.dto.procurement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseRequest(
        @NotNull UUID quotationId,
        String purchaseOrderNumber,
        @NotBlank String vendorName,
        @NotNull @Positive BigDecimal amount,
        String currency,
        String notes
) {
}
