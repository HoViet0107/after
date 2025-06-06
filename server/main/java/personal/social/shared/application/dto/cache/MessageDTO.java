package personal.social.shared.application.dto.cache;

import java.time.LocalDateTime;

public record MessageDTO(
        String id,
        String content,
        String senderId,
        String conversationId,
        LocalDateTime timestamp
) {}
