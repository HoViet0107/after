package personal.social.conversation.domain.event;

import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record ConversationCreatedEvent(
        ConversationId conversationId,
        UserId createdBy,
        boolean isGroupChat,
        LocalDateTime occurredOn
) implements DomainEvent {

    public ConversationCreatedEvent(ConversationId conversationId, UserId createdBy, boolean isGroupChat) {
        this(conversationId, createdBy, isGroupChat, LocalDateTime.now());
    }
}
