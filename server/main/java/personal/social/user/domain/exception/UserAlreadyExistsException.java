package personal.social.user.domain.exception;

/**
 * Exception thrown when attempting to create a user that already exists in the system.
 * Extends RuntimeException to allow unchecked exception handling.
 */
public class UserAlreadyExistsException extends RuntimeException {
    /**
     * Creates a new UserAlreadyExistsException with the given message.
     * @param message a message describing the exception
     */
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
