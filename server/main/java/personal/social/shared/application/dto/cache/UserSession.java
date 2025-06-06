package personal.social.shared.application.dto.cache;

import java.time.LocalDateTime;

public record UserSession(
        String userId,
        String sessionId,
        String deviceInfo,
        LocalDateTime lastActive,
        boolean isOnline
) {}
