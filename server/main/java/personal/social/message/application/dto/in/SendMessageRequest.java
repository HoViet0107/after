package personal.social.message.application.dto.in;

public record SendMessageRequest(
        String conversationId,
        String senderId,
        String content,
        String type,
        String replyToId
) {}
