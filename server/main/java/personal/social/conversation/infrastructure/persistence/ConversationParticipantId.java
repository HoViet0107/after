package personal.social.conversation.infrastructure.persistence;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ConversationParticipantId implements Serializable {
    private String conversationId;
    private String userId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationParticipantId that = (ConversationParticipantId) o;
        return Objects.equals(conversationId, that.conversationId) &&
                Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversationId, userId);
    }
}
