package personal.social.auth.application.dto.out;

/**
 * Record representing the response after registering a new user in the system.
 * Contains the newly created user's ID, email, full name, and the creation timestamp.
 */
public record RegisterResponse(
        String message,
        boolean success
) {}
