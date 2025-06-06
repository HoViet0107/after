package personal.social.conversation.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationJpaRepository extends JpaRepository<ConversationEntity, String> {

    @Query("SELECT c FROM ConversationEntity c JOIN c.participants p WHERE p.userId = :userId AND p.isActive = true")
    List<ConversationEntity> findByParticipantsUserId(@Param("userId") String userId);

    @Query("""
        SELECT c FROM ConversationEntity c 
        WHERE c.isGroupChat = false 
        AND EXISTS (SELECT 1 FROM ConversationParticipantEntity p1 WHERE p1.conversationId = c.id AND p1.userId = :user1)
        AND EXISTS (SELECT 1 FROM ConversationParticipantEntity p2 WHERE p2.conversationId = c.id AND p2.userId = :user2)
        """)
    Optional<ConversationEntity> findDirectMessageBetween(@Param("user1") String user1, @Param("user2") String user2);
}
