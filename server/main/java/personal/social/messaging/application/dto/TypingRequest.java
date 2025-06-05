package personal.social.messaging.application.dto;

public record TypingRequest(
        String conversationId,
        String username
) {}
