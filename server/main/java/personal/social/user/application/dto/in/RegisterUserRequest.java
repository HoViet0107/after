package personal.social.user.application.dto.in;

/**
 * Record representing a request to register a new user in the system.
 * Contains all necessary user information for account creation including
 * authentication credentials, personal details, and profile information.
 */
public record RegisterUserRequest(
        String email,
        String password,
        String firstName,
        String middleName,
        String lastName,
        String bio,
        String avatarUrl
) {}

