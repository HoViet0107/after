package personal.social.user.application.dto.out;

import java.time.LocalDateTime;

/**
 * Response DTO for user profile update operations.
 * Contains the updated user information including ID, full name, and timestamp.
 */
public record EditUserProfileResponse(
        String userId,
        String fullName,
        LocalDateTime updatedAt
) {}
