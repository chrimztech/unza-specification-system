package zm.unza.cict.specification.common.exception;

/** Raised for any failure talking to the external UNZA HR system. */
public class HrIntegrationException extends RuntimeException {
    public HrIntegrationException(String message) {
        super(message);
    }
}
