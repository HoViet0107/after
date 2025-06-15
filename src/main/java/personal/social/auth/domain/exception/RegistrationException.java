package personal.social.auth.domain.exception;

// Runtime exception to trigger rollback
public class RegistrationException extends RuntimeException {
    public RegistrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
