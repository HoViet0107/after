package personal.social.conversation.application.dto.out;

import personal.social.conversation.domain.model.Conversation;

import java.time.LocalDateTime;

public record ConversationResponse(
        String id,
        String title,
        String avatarUrl,
        boolean isGroupChat,
        int participantCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ConversationResponse from(Conversation conversation) {
        return new ConversationResponse(
                conversation.getId().value(),
                conversation.getTitle().value(),
                conversation.getAvatarUrl(),
                conversation.isGroupChat(),
                conversation.getParticipantCount(),
                conversation.getCreatedAt(),
                conversation.getEditedAt()
        );
    }
}
