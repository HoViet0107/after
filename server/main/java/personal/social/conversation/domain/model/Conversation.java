package personal.social.conversation.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.conversation.domain.model.vo.ConversationTitle;
import personal.social.conversation.domain.model.vo.ParticipantRole;
import personal.social.conversation.domain.event.ConversationCreatedEvent;
import personal.social.conversation.domain.event.ParticipantAddedEvent;
import personal.social.conversation.domain.event.ParticipantRemovedEvent;
import personal.social.shared.domain.AggregateRoot;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@Builder
public class Conversation extends AggregateRoot<ConversationId> {

    private final ConversationId id;
    private ConversationTitle title;
    private String avatarUrl;
    private final boolean isGroupChat;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String lastMessageId;

    @Builder.Default
    private final Set<ConversationParticipant> participants = new HashSet<>();

    private Conversation(ConversationId id, ConversationTitle title, String avatarUrl,
                         boolean isGroupChat, UserId creatorId) {
        this.id = Objects.requireNonNull(id);
        this.title = Objects.requireNonNull(title);
        this.avatarUrl = avatarUrl;
        this.isGroupChat = isGroupChat;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // Add creator as admin participant
        this.participants.add(ConversationParticipant.create(
                this.id, creatorId, ParticipantRole.ADMIN
        ));

        // Add domain event
        addDomainEvent(new ConversationCreatedEvent(this.id, creatorId, isGroupChat));
    }

    public static Conversation createDirectMessage(ConversationId id, UserId user1, UserId user2) {
        if (user1.equals(user2)) {
            throw new IllegalArgumentException("Cannot create direct message with same user");
        }

        Conversation conversation = new Conversation(
                id,
                ConversationTitle.of("Direct Message"),
                null,
                false,
                user1
        );

        // Add second participant
        conversation.participants.add(ConversationParticipant.create(
                id, user2, ParticipantRole.PARTICIPANT
        ));

        return conversation;
    }

    public static Conversation createGroupChat(ConversationId id, ConversationTitle title,
                                               String avatarUrl, UserId creatorId) {
        return new Conversation(id, title, avatarUrl, true, creatorId);
    }

    // Business Methods
    public void addParticipant(UserId userId, ParticipantRole role, UserId addedBy) {
        validateCanAddParticipant(addedBy);

        if (isParticipant(userId)) {
            throw new IllegalStateException("User is already a participant");
        }

        ConversationParticipant participant = ConversationParticipant.create(this.id, userId, role);
        this.participants.add(participant);
        this.updatedAt = LocalDateTime.now();

        addDomainEvent(new ParticipantAddedEvent(this.id, userId, addedBy, role));
    }

    public void removeParticipant(UserId userId, UserId removedBy) {
        validateCanRemoveParticipant(removedBy, userId);

        boolean removed = this.participants.removeIf(p -> p.getUserId().equals(userId));
        if (!removed) {
            throw new IllegalStateException("User is not a participant");
        }

        this.updatedAt = LocalDateTime.now();
        addDomainEvent(new ParticipantRemovedEvent(this.id, userId, removedBy));
    }

    public void updateTitle(ConversationTitle newTitle, UserId updatedBy) {
        validateCanUpdateConversation(updatedBy);
        this.title = newTitle;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateLastMessage(String messageId) {
        this.lastMessageId = messageId;
        this.updatedAt = LocalDateTime.now();
    }

    // Query Methods
    public boolean isParticipant(UserId userId) {
        return participants.stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.isActive());
    }

    public boolean isAdmin(UserId userId) {
        return participants.stream()
                .anyMatch(p -> p.getUserId().equals(userId) &&
                        p.getRole() == ParticipantRole.ADMIN && p.isActive());
    }

    public int getParticipantCount() {
        return (int) participants.stream().filter(ConversationParticipant::isActive).count();
    }

    public List<UserId> getActiveParticipantIds() {
        return participants.stream()
                .filter(ConversationParticipant::isActive)
                .map(ConversationParticipant::getUserId)
                .toList();
    }

    // Validation Methods
    private void validateCanAddParticipant(UserId userId) {
        if (!isGroupChat) {
            throw new IllegalStateException("Cannot add participants to direct message");
        }
        if (!isAdmin(userId)) {
            throw new IllegalStateException("Only admins can add participants");
        }
    }

    private void validateCanRemoveParticipant(UserId removedBy, UserId userToRemove) {
        if (!isGroupChat) {
            throw new IllegalStateException("Cannot remove participants from direct message");
        }
        if (!isAdmin(removedBy) && !removedBy.equals(userToRemove)) {
            throw new IllegalStateException("Only admins can remove other participants");
        }
    }

    private void validateCanUpdateConversation(UserId userId) {
        if (!isGroupChat) {
            throw new IllegalStateException("Cannot update direct message details");
        }
        if (!isAdmin(userId)) {
            throw new IllegalStateException("Only admins can update conversation");
        }
    }

    @Override
    public ConversationId getId() {
        return this.id;
    }
}
