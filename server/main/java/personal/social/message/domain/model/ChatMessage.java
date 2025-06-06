package personal.social.message.domain.model;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
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

@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class ChatMessage extends AggregateRoot<MessageId> {

    // Auto-generate ID if not provided
    @lombok.Builder.Default
    private final MessageId id = MessageId.generate();

    // Required fields
    private final ConversationId conversationId;
    private final UserId senderId;
    private MessageContent content;
    private final MessageType type;

    // Auto-generate timestamps
    @lombok.Builder.Default
    private final LocalDateTime sentAt = LocalDateTime.now();
    private LocalDateTime editedAt;

    // Optional fields
    private final MessageId replyToId;

    // Default status
    @lombok.Builder.Default
    private MessageStatus status = MessageStatus.SENT;
    @lombok.Builder.Default
    private boolean isDeleted = false;

    // ================================
    // FACTORY METHODS (Static helpers)
    // ================================

    /**
     * Create new message
     */
    public static ChatMessage create(MessageId id, ConversationId conversationId,
                                     UserId senderId, MessageContent content,
                                     MessageType type, MessageId replyToId) {
        ChatMessage message = ChatMessage.builder()
                .id(id)
                .conversationId(conversationId)
                .senderId(senderId)
                .content(content)
                .type(type)
                .replyToId(replyToId)
                .build();

        // Add domain event
        message.addDomainEvent(new MessageSentEvent(message.id, message.conversationId, message.senderId));
        return message;
    }

    /**
     * Create simple text message
     */
    public static ChatMessage createTextMessage(ConversationId conversationId,
                                                UserId senderId, MessageContent content) {
        return create(MessageId.generate(), conversationId, senderId, content, MessageType.TEXT, null);
    }

    /**
     * Create reply message
     */
    public static ChatMessage createReply(ConversationId conversationId,
                                          UserId senderId, MessageContent content,
                                          MessageId replyToId) {
        return create(MessageId.generate(), conversationId, senderId, content, MessageType.TEXT, replyToId);
    }

    // ================================
    // BUSINESS LOGIC METHODS
    // ================================

    public void markAsDelivered() {
        if (this.status == MessageStatus.SENT) {
            this.status = MessageStatus.DELIVERED;
        }
    }

    public void markAsRead(UserId readBy) {
        Objects.requireNonNull(readBy, "Read by user ID cannot be null");

        if (this.status != MessageStatus.READ) {
            this.status = MessageStatus.READ;
            addDomainEvent(new MessageReadEvent(this.id, this.conversationId, readBy));
        }
    }

    public void editContent(MessageContent newContent, UserId editBy) {
        Objects.requireNonNull(newContent, "Content cannot be null");
        Objects.requireNonNull(editBy, "Edit by user ID cannot be null");

        validateCanEdit(editBy);
        this.content = newContent;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteMessage(UserId deletedBy) {
        Objects.requireNonNull(deletedBy, "Deleted by user ID cannot be null");

        validateCanDelete(deletedBy);
        this.isDeleted = true;
        this.content = MessageContent.of("[Message deleted]");
        this.editedAt = LocalDateTime.now();
    }

    public void recoverMessage(MessageContent originalContent, UserId recoveredBy) {
        Objects.requireNonNull(originalContent, "Original content cannot be null");
        Objects.requireNonNull(recoveredBy, "Recovered by user ID cannot be null");

        if (!this.senderId.equals(recoveredBy)) {
            throw new IllegalStateException("Only sender can recover message");
        }

        if (!this.isDeleted) {
            throw new IllegalStateException("Message is not deleted");
        }

        this.isDeleted = false;
        this.content = originalContent;
        this.editedAt = LocalDateTime.now();
    }

    // ================================
    // VALIDATION METHODS
    // ================================

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

    public void validateUserCanPerformAction(UserId userId, String action) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        switch (action.toLowerCase()) {
            case "edit", "delete" -> {
                if (!this.senderId.equals(userId)) {
                    throw new IllegalStateException("Only message sender can " + action + " their message");
                }
            }
            case "read" -> {
                if (this.senderId.equals(userId)) {
                    throw new IllegalStateException("User cannot mark their own message as read");
                }
            }
        }
    }

    // ================================
    // QUERY METHODS
    // ================================

    public boolean isEdited() {
        return this.editedAt != null && !this.editedAt.equals(this.sentAt);
    }

    public boolean isReply() {
        return this.replyToId != null;
    }

    public boolean isTextMessage() {
        return this.type == MessageType.TEXT;
    }

    public boolean isSystemMessage() {
        return this.type == MessageType.SYSTEM;
    }

    public boolean canBeEdited() {
        return !this.isDeleted &&
                this.sentAt.isAfter(LocalDateTime.now().minusDays(1));
    }

    public boolean canBeDeleted() {
        return !this.isDeleted;
    }

    public boolean isDelivered() {
        return this.status == MessageStatus.DELIVERED || this.status == MessageStatus.READ;
    }

    public boolean isRead() {
        return this.status == MessageStatus.READ;
    }

    public boolean isSentBy(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.senderId.equals(userId);
    }

    // ================================
    // UTILITY METHODS
    // ================================

    public String getContentText() {
        return this.content != null ? this.content.text() : "";
    }

    public long getAgeInMinutes() {
        return java.time.Duration.between(this.sentAt, LocalDateTime.now()).toMinutes();
    }

    public long getAgeInHours() {
        return java.time.Duration.between(this.sentAt, LocalDateTime.now()).toHours();
    }

    // ================================
    // AGGREGATE ROOT IMPLEMENTATION
    // ================================

    @Override
    public MessageId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        ChatMessage that = (ChatMessage) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("ChatMessage{id=%s, conversationId=%s, senderId=%s, type=%s, status=%s, sentAt=%s, isDeleted=%s}",
                id, conversationId, senderId, type, status, sentAt, isDeleted);
    }
}