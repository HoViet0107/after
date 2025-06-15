package personal.social.user.application.dto.in;

import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "User ID is required")
        String userId,

        @NotNull(message = "Status is required")
        String status // "online", "offline", "active"
) {}
