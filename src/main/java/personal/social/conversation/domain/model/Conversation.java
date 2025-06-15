package personal.social.conversation.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
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
@SuperBuilder(toBuilder = true)
public class Conversation extends AggregateRoot<ConversationId> {
    // Auto-generate ID if not provided
    @lombok.Builder.Default
    private final ConversationId id = ConversationId.generate();

    // Required fields
    private final boolean isGroupChat;

    // Default values
    @lombok.Builder.Default
    private ConversationTitle title = ConversationTitle.of("New Conversation");
    @lombok.Builder.Default
    private String avatarUrl = "";

    // Auto-generate timestamps
    @lombok.Builder.Default
    private final LocalDateTime createdAt = LocalDateTime.now();
    @lombok.Builder.Default
    private LocalDateTime editedAt = LocalDateTime.now();

    // Collections with default initialization
    @lombok.Builder.Default
    private final Set<ConversationParticipant> participants = new HashSet<>();

    // Optional fields
    private String lastMessageId;

    // ================================
    // FACTORY METHODS (Static helpers)
    // ================================

    /**
     * Create direct conversation between two users
     */
    public static Conversation createDirectConversation(ConversationId id, UserId user1, UserId user2) {
        if (user1.equals(user2)) {
            throw new IllegalArgumentException("Cannot create direct message with same user");
        }

        Conversation conversation = Conversation.builder()
                .id(id)
                .title(ConversationTitle.of("Direct Message"))
                .avatarUrl(null)
                .isGroupChat(false)
                .build();

        // Add participants
        conversation.participants.add(ConversationParticipant.create(id, user1, ParticipantRole.ADMIN));
        conversation.participants.add(ConversationParticipant.create(id, user2, ParticipantRole.PARTICIPANT));

        // Add domain event
        conversation.addDomainEvent(new ConversationCreatedEvent(conversation.id, user1, false));

        return conversation;
    }

    /**
     * Create direct conversation with auto-generated ID
     */
    public static Conversation createDirectConversation(UserId user1, UserId user2) {
        return createDirectConversation(ConversationId.generate(), user1, user2);
    }

    /**
     * Create group chat
     */
    public static Conversation createGroupChat(ConversationId id, ConversationTitle title,
                                               String avatarUrl, UserId creatorId) {
        Conversation conversation = Conversation.builder()
                .id(id)
                .title(title)
                .avatarUrl(avatarUrl)
                .isGroupChat(true)
                .build();

        // Add creator as admin participant
        conversation.participants.add(ConversationParticipant.create(id, creatorId, ParticipantRole.ADMIN));

        // Add domain event
        conversation.addDomainEvent(new ConversationCreatedEvent(conversation.id, creatorId, true));

        return conversation;
    }

    /**
     * Create group chat with auto-generated ID
     */
    public static Conversation createGroupChat(ConversationTitle title, String avatarUrl, UserId creatorId) {
        return createGroupChat(ConversationId.generate(), title, avatarUrl, creatorId);
    }

    // ================================
    // BUSINESS LOGIC METHODS
    // ================================

    public void addParticipant(UserId userId, ParticipantRole role, UserId addedBy) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        Objects.requireNonNull(role, "Role cannot be null");
        Objects.requireNonNull(addedBy, "Added by user ID cannot be null");

        validateCanAddParticipant(addedBy);

        if (isParticipant(userId)) {
            throw new IllegalStateException("User is already a participant");
        }

        ConversationParticipant participant = ConversationParticipant.create(this.id, userId, role);
        this.participants.add(participant);
        this.editedAt = LocalDateTime.now();

        addDomainEvent(new ParticipantAddedEvent(this.id, userId, addedBy, role));
    }

    public void removeParticipant(UserId userId, UserId removedBy) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        Objects.requireNonNull(removedBy, "Removed by user ID cannot be null");

        validateCanRemoveParticipant(removedBy, userId);

        boolean removed = this.participants.removeIf(p -> p.getUserId().equals(userId));
        if (!removed) {
            throw new IllegalStateException("User is not a participant");
        }

        this.editedAt = LocalDateTime.now();
        addDomainEvent(new ParticipantRemovedEvent(this.id, userId, removedBy));
    }

    public void updateTitle(ConversationTitle newTitle, UserId updatedBy) {
        Objects.requireNonNull(newTitle, "Title cannot be null");
        Objects.requireNonNull(updatedBy, "Updated by user ID cannot be null");

        validateCanUpdateConversation(updatedBy);
        this.title = newTitle;
        this.editedAt = LocalDateTime.now();
    }

    public void updateAvatar(String newAvatarUrl, UserId updatedBy) {
        Objects.requireNonNull(updatedBy, "Updated by user ID cannot be null");

        validateCanUpdateConversation(updatedBy);
        this.avatarUrl = newAvatarUrl;
        this.editedAt = LocalDateTime.now();
    }

    public void updateLastMessage(String messageId) {
        this.lastMessageId = messageId;
        this.editedAt = LocalDateTime.now();
    }

    public void promoteToAdmin(UserId userId, UserId promotedBy) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        Objects.requireNonNull(promotedBy, "Promoted by user ID cannot be null");

        if (!isGroupChat) {
            throw new IllegalStateException("Cannot promote participants in direct message");
        }

        if (!isAdmin(promotedBy)) {
            throw new IllegalStateException("Only admins can promote other participants");
        }

        ConversationParticipant participant = findParticipant(userId);
        if (participant == null) {
            throw new IllegalStateException("User is not a participant");
        }

        // Update participant role (this would require modifying the participant)
        // For immutable design, we might need to remove and re-add
        removeParticipant(userId, promotedBy);
        addParticipant(userId, ParticipantRole.ADMIN, promotedBy);
    }

    // ================================
    // QUERY METHODS
    // ================================

    public boolean isParticipant(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return participants.stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.isActive());
    }

    public boolean isAdmin(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return participants.stream()
                .anyMatch(p -> p.getUserId().equals(userId) &&
                        p.getRole() == ParticipantRole.ADMIN && p.isActive());
    }

    public boolean isDirectMessage() {
        return !this.isGroupChat;
    }

    public boolean hasParticipants() {
        return !this.participants.isEmpty();
    }

    public boolean hasLastMessage() {
        return this.lastMessageId != null && !this.lastMessageId.trim().isEmpty();
    }

    public int getParticipantCount() {
        return (int) participants.stream().filter(ConversationParticipant::isActive).count();
    }

    public int getAdminCount() {
        return (int) participants.stream()
                .filter(p -> p.isActive() && p.getRole() == ParticipantRole.ADMIN)
                .count();
    }

    public List<UserId> getActiveParticipantIds() {
        return participants.stream()
                .filter(ConversationParticipant::isActive)
                .map(ConversationParticipant::getUserId)
                .toList();
    }

    public List<UserId> getAdminIds() {
        return participants.stream()
                .filter(p -> p.isActive() && p.getRole() == ParticipantRole.ADMIN)
                .map(ConversationParticipant::getUserId)
                .toList();
    }

    public ConversationParticipant findParticipant(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return participants.stream()
                .filter(p -> p.getUserId().equals(userId) && p.isActive())
                .findFirst()
                .orElse(null);
    }

    // ================================
    // VALIDATION METHODS
    // ================================

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

    public void validateUserCanPerformAction(UserId userId, String action) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!isParticipant(userId)) {
            throw new IllegalStateException("User is not a participant in this conversation");
        }

        switch (action.toLowerCase()) {
            case "add_participant", "remove_participant", "update_title", "update_avatar" -> {
                if (!isAdmin(userId)) {
                    throw new IllegalStateException("Only admins can " + action.replace("_", " "));
                }
            }
            case "leave" -> {
                if (isGroupChat && getAdminCount() == 1 && isAdmin(userId) && getParticipantCount() > 1) {
                    throw new IllegalStateException("Cannot leave group chat as the only admin. Promote another admin first.");
                }
            }
        }
    }

    // ================================
    // UTILITY METHODS
    // ================================

    public String getDisplayTitle() {
        if (this.title != null && !this.title.value().trim().isEmpty()) {
            return this.title.value();
        }

        if (isDirectMessage() && getParticipantCount() == 2) {
            // For direct messages, could return the other participant's name
            // This would require additional logic to determine the "other" user
            return "Direct Message";
        }

        return "Conversation";
    }

    public long getAgeInDays() {
        return java.time.Duration.between(this.createdAt, LocalDateTime.now()).toDays();
    }

    public long getTimeSinceLastUpdateInMinutes() {
        return java.time.Duration.between(this.editedAt, LocalDateTime.now()).toMinutes();
    }

    // ================================
    // AGGREGATE ROOT IMPLEMENTATION
    // ================================

    @Override
    public ConversationId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Conversation that = (Conversation) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Conversation{id=%s, title=%s, isGroupChat=%s, participantCount=%d, createdAt=%s}",
                id, title, isGroupChat, getParticipantCount(), createdAt);
    }
}