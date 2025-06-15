package personal.social.user.application.dto.out;

import personal.social.user.domain.model.Users;

import java.time.LocalDateTime;

public record UserResponse(
        String id,
        String email,
        String firstName,
        String middleName,
        String lastName,
        String fullName,
        String bio,
        String avatarUrl,
        String status,
        boolean isOnline,
        LocalDateTime lastActiveAt,
        LocalDateTime createdAt
) {
    public static UserResponse from(Users user) {
        return new UserResponse(
                user.getId().value(),
                user.getEmail().value(),
                user.getProfile().getFirstName(),
                user.getProfile().getMiddleName(),
                user.getProfile().getLastName(),
                user.getProfile().getFullName(),
                user.getProfile().getBio(),
                user.getProfile().getAvatarUrl(),
                user.getStatus().toString(),
                user.isOnline(),
                user.getLastActiveAt(),
                user.getCreatedAt()
        );
    }
}
