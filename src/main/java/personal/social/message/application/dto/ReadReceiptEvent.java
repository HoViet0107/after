package personal.social.message.application.dto;

import java.time.LocalDateTime;

public record ReadReceiptEvent(
        String messageId,
        String userId,
        LocalDateTime readAt
) {}
