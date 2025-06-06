package personal.social.conversation.domain.repository;

import personal.social.conversation.domain.model.Conversation;
import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository {
    Conversation save(Conversation conversation);
    Optional<Conversation> findById(ConversationId id);
    List<Conversation> findByParticipant(UserId userId);
    Optional<Conversation> findDirectMessageBetween(UserId user1, UserId user2);
    void delete(ConversationId id);
    boolean existsById(ConversationId id);

    List<String> findPopularConversationIds();
}
