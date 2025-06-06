package personal.social.message.application.dto;

import java.time.LocalDateTime;

public record PresenceEvent(
        String userId,
        String username,
        boolean isOnline,
        LocalDateTime timestamp
) {}
