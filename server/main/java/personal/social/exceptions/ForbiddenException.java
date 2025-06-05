package personal.social.exceptions;

/**
 * Exception thrown when a user attempts to access a resource or perform an action
 * for which they do not have the necessary permissions.
 * <p>
 * This exception extends RuntimeException to allow for unchecked exception handling
 * in authorization scenarios.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
