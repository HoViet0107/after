package personal.social.conversation.domain.event;

import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record ParticipantRemovedEvent(
        ConversationId conversationId,
        UserId participantId,
        UserId removedBy,
        LocalDateTime occurredOn
) implements DomainEvent {

    public ParticipantRemovedEvent(ConversationId conversationId, UserId participantId, UserId removedBy) {
        this(conversationId, participantId, removedBy, LocalDateTime.now());
    }
}
