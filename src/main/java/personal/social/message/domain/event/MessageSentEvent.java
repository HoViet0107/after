package personal.social.message.domain.event;

import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record MessageSentEvent(
        MessageId messageId,
        ConversationId conversationId,
        UserId senderId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public MessageSentEvent(MessageId messageId, ConversationId conversationId, UserId senderId) {
        this(messageId, conversationId, senderId, LocalDateTime.now());
    }
}

