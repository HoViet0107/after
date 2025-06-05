package personal.social.messaging.application.dto;

import java.time.LocalDateTime;

public record UserPresence(
        String userId,
        String username,
        boolean isOnline,
        LocalDateTime lastSeen
) {}
