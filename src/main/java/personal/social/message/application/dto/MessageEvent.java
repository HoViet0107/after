package personal.social.message.application.dto;

import java.time.LocalDateTime;

public record MessageEvent(
        String messageId,
        String conversationId,
        String senderId,
        String content,
        String type,
        LocalDateTime timestamp,
        String replyToId
) {}
