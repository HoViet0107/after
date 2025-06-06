package personal.social.user.application.dto;

/**
 * A record representing a request to update a user's profile information.
 * Contains all the fields that can be updated for a user profile including
 * personal details and profile media.
 */
public record UpdateUserProfileRequest(
        String userId,
        String firstName,
        String middleName,
        String lastName,
        String bio,
        String avatarUrl
) {}
