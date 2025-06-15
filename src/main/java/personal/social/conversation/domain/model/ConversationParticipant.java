package personal.social.conversation.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.conversation.domain.model.vo.ParticipantRole;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Builder
@AllArgsConstructor
public class ConversationParticipant {
    private final ConversationId conversationId;
    private final UserId userId;
    private final ParticipantRole role;
    private final LocalDateTime joinedAt;
    private final boolean isOnline;
    private final boolean isActive;

    @Builder
    private ConversationParticipant(ConversationId conversationId, UserId userId,
                                    ParticipantRole role, LocalDateTime joinedAt,
                                    Boolean isOnline, Boolean isActive) {
        this.conversationId = Objects.requireNonNull(conversationId);
        this.userId = Objects.requireNonNull(userId);
        this.role = Objects.requireNonNull(role);
        this.joinedAt = joinedAt != null ? joinedAt : LocalDateTime.now();
        this.isOnline = isOnline != null ? isOnline : false;
        this.isActive = isActive != null ? isActive : true;
    }

    public static ConversationParticipant create(ConversationId conversationId,
                                                 UserId userId, ParticipantRole role) {
        return builder()
                .conversationId(conversationId)
                .userId(userId)
                .role(role)
                .isOnline(false).isActive(true).build();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationParticipant that = (ConversationParticipant) o;
        return Objects.equals(conversationId, that.conversationId) &&
                Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversationId, userId);
    }
}
