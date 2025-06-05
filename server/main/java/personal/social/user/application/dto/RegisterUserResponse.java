package personal.social.user.application.dto;

import java.time.LocalDateTime;

/**
 * Record representing the response after registering a new user in the system.
 * Contains the newly created user's ID, email, full name, and the creation timestamp.
 */
public record RegisterUserResponse(
        Long userId,
        String email,
        String fullName,
        LocalDateTime createdAt
) {}
