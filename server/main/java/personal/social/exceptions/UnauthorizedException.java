package personal.social.exceptions;

/**
 * Exception thrown when a user attempts to perform an action without proper authorization.
 * This runtime exception is used to indicate unauthorized access to resources or operations.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
