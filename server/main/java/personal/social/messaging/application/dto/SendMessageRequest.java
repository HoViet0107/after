package personal.social.messaging.application.dto;

public record SendMessageRequest(
        String conversationId,
        String senderId,
        String content,
        String type,
        String replyToId
) {}
