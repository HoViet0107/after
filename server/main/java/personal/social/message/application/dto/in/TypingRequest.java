package personal.social.message.application.dto.in;

public record TypingRequest(
        String conversationId,
        String username
) {}
