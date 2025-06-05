package personal.social.messaging.application.dto;

public record JoinConversationRequest(
        String conversationId,
        String username
) {}
