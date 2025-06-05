package personal.social.messaging.application.dto;

import java.time.LocalDateTime;

public record SendMessageResponse(
        String messageId,
        LocalDateTime timestamp,
        String status
) {}
