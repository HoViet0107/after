package personal.social.message.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import personal.social.message.domain.event.MessageReadEvent;
import personal.social.message.domain.event.MessageSentEvent;
import personal.social.message.domain.model.enums.MessageStatus;
import personal.social.message.domain.model.enums.MessageType;
import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;
import personal.social.shared.domain.AggregateRoot;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter @Setter @Builder
public class ChatMessage extends AggregateRoot<MessageId> {
    private final MessageId id;
    private final ConversationId conversationId;
    private final UserId senderId;
    private MessageContent content;
    private final MessageType type;
    private final LocalDateTime sentAt;
    private LocalDateTime editedAt;
    private final MessageId replyToId;
    private MessageStatus status;
    private boolean isDeleted;

    private ChatMessage(MessageId id, ConversationId conversationId,
                        UserId senderId, MessageContent content,
                        MessageType type, MessageId replyToId) {
        this.id = Objects.requireNonNull(id);
        this.conversationId = Objects.requireNonNull(conversationId);
        this.senderId = Objects.requireNonNull(senderId);
        this.content = Objects.requireNonNull(content);
        this.type = Objects.requireNonNull(type);
        this.sentAt = LocalDateTime.now();
        this.replyToId = replyToId;
        this.status = MessageStatus.SENT;
        this.isDeleted = false;

        // Add domain event
        addDomainEvent(new MessageSentEvent(this.id, this.conversationId, this.senderId));
    }

    public static ChatMessage create(MessageId id, ConversationId conversationId,
                                     UserId senderId, MessageContent content,
                                     MessageType type, MessageId replyToId) {
        return new ChatMessage(id, conversationId, senderId, content, type, replyToId);
    }

    // Business Methods
    public void markAsDelivered() {
        if (this.status == MessageStatus.SENT) {
            this.status = MessageStatus.DELIVERED;
        }
    }

    public void markAsRead(UserId readBy) {
        if (this.status != MessageStatus.READ) {
            this.status = MessageStatus.READ;
            addDomainEvent(new MessageReadEvent(this.id, this.conversationId, readBy));
        }
    }

    public void editContent(MessageContent newContent, UserId editBy) {
        validateCanEdit(editBy);
        this.content = newContent;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteMessage(UserId deletedBy) {
        validateCanDelete(deletedBy);
        this.isDeleted = true;
        this.content = MessageContent.of("[Message deleted]");
    }

    // Validation Methods
    private void validateCanEdit(UserId userId) {
        if (!this.senderId.equals(userId)) {
            throw new IllegalStateException("Only sender can edit message");
        }
        if (this.isDeleted) {
            throw new IllegalStateException("Cannot edit deleted message");
        }
        // Can edit within 24 hours
        if (this.sentAt.isBefore(LocalDateTime.now().minusDays(1))) {
            throw new IllegalStateException("Cannot edit message after 24 hours");
        }
    }

    private void validateCanDelete(UserId userId) {
        if (!this.senderId.equals(userId)) {
            throw new IllegalStateException("Only sender can delete message");
        }
        if (this.isDeleted) {
            throw new IllegalStateException("Message already deleted");
        }
    }

    // Query Methods
    public boolean isEdited() {
        return this.editedAt != null;
    }

    public boolean isReply() {
        return this.replyToId != null;
    }

    @Override
    public MessageId getId() {
        return this.id;
    }
}
