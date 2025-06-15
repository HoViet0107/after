package personal.social.message.application.dto.out;

import java.time.LocalDateTime;

public record SendMessageResponse(
        String messageId,
        LocalDateTime timestamp,
        String status
) {}
