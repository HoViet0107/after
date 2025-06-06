package personal.social.message.domain.event;

import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record MessageReadEvent(
        MessageId messageId,
        ConversationId conversationId,
        UserId readBy,
        LocalDateTime occurredOn
) implements DomainEvent {

    public MessageReadEvent(MessageId messageId, ConversationId conversationId, UserId readBy) {
        this(messageId, conversationId, readBy, LocalDateTime.now());
    }
}
