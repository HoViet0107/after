package personal.social.message.application.dto.in;

public record JoinConversationRequest(
        String conversationId,
        String username
) {}
