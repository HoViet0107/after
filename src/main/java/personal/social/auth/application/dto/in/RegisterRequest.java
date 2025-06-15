package personal.social.auth.application.dto.in;

import java.time.LocalDateTime;

/**
 * Record representing a request to register a new user in the system.
 * Contains all necessary user information for account creation including
 * authentication credentials, personal details, and profile information.
 */
public record RegisterRequest(
        String email,
        String password,
        String firstName,
        String middleName,
        String lastName,
        LocalDateTime dob,
        String gender,
        String phoneNumber,
        String bio,
        String avatarUrl
) {}

