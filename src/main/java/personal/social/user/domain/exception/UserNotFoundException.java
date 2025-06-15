package personal.social.user.domain.exception;

/**
 * Exception thrown when a user cannot be found in the system.
 * <p>
 * This exception is thrown when operations that require an existing user
 * are attempted but the referenced user does not exist in the data store.
 * Since it extends RuntimeException, it is an unchecked exception.
 * </p>
 */

public class UserNotFoundException extends RuntimeException {
    /**
     * Constructs a new UserNotFoundException with the specified detail message.
     * This exception is thrown when a requested user cannot be found in the system.
     *
     * @param message the detail message that provides information about the not found user
     */
    public UserNotFoundException(String message) {
        super(message);
    }
}
