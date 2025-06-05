package personal.social.messaging.domain.model;

import lombok.Getter;
import personal.social.user.domain.model.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
public class ChatMessage {
    private final MessageId id;
    private final ConversationId conversationId;
    private final UserId senderId;
    private final MessageContent content;
    private final MessageType type;
    private final LocalDateTime timestamp;
    private final MessageId replyToId;
    private MessageStatus status;

    private ChatMessage(MessageId id, ConversationId conversationId,
                        UserId senderId, MessageContent content,
                        MessageType type, MessageId replyToId) {
        this.id = Objects.requireNonNull(id);
        this.conversationId = Objects.requireNonNull(conversationId);
        this.senderId = Objects.requireNonNull(senderId);
        this.content = Objects.requireNonNull(content);
        this.type = Objects.requireNonNull(type);
        this.timestamp = LocalDateTime.now();
        this.replyToId = replyToId;
        this.status = MessageStatus.SENT;
    }

    public static ChatMessage create(MessageId id, ConversationId conversationId,
                                     UserId senderId, MessageContent content,
                                     MessageType type, MessageId replyToId) {
        return new ChatMessage(id, conversationId, senderId, content, type, replyToId);
    }

    public void markAsDelivered() {
        this.status = MessageStatus.DELIVERED;
    }

    public void markAsRead() {
        this.status = MessageStatus.READ;
    }
}
