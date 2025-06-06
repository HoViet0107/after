package personal.social.message.application.dto.out;

import personal.social.message.application.dto.MessageDto;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationHistoryResponse(
        String conversationId,
        List<MessageDto> messages,
        boolean hasMore,
        String nextCursor,
        LocalDateTime timestamp
) {}
