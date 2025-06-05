package personal.social.messaging.application.dto;

import java.time.LocalDateTime;

public record TypingIndicator(
        String conversationId,
        String userId,
        String username,
        boolean isTyping,
        LocalDateTime timestamp
) {}
