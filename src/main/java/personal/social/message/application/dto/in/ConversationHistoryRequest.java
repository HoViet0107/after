package personal.social.message.application.dto.in;

public record ConversationHistoryRequest(
        String conversationId,
        String userId,
        int page,
        int size,
        String cursor
) {}
