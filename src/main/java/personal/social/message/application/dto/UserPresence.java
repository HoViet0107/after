package personal.social.message.application.dto;

import java.time.LocalDateTime;

public record UserPresence(
        String userId,
        String username,
        boolean isOnline,
        LocalDateTime lastSeen
) {}
