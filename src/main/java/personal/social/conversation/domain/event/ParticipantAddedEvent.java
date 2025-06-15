package personal.social.conversation.domain.event;

import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.conversation.domain.model.vo.ParticipantRole;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record ParticipantAddedEvent(
        ConversationId conversationId,
        UserId participantId,
        UserId addedBy,
        ParticipantRole role,
        LocalDateTime occurredOn
) implements DomainEvent {

    public ParticipantAddedEvent(ConversationId conversationId, UserId participantId,
                                 UserId addedBy, ParticipantRole role) {
        this(conversationId, participantId, addedBy, role, LocalDateTime.now());
    }
}
