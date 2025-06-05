package personal.social.exceptions;

/**
 * Exception thrown when a requested resource cannot be found.
 * <p>
 * This runtime exception is used to indicate that a specific resource
 * (such as a user, post, or other entity) does not exist in the system.
 *
 * @since 1.0
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
