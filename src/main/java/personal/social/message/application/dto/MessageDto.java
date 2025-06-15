package personal.social.message.application.dto;

import java.time.LocalDateTime;

public record MessageDto(
        String id,
        String conversationId,
        String senderId,
        String senderName,
        String content,
        String type,
        LocalDateTime sentAt,
        LocalDateTime editedAt,
        String replyToId,
        String status,
        boolean isRead
) {}
