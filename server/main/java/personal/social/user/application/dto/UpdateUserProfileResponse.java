package personal.social.user.application.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for user profile update operations.
 * Contains the updated user information including ID, full name, and timestamp.
 */
public record UpdateUserProfileResponse(
        String userId,
        String fullName,
        LocalDateTime updatedAt
) {}
