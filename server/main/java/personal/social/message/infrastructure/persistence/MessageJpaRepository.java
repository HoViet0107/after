package personal.social.message.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageJpaRepository extends JpaRepository<MessageEntity, String> {

    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId AND m.isDeleted = false ORDER BY m.sentAt DESC")
    List<MessageEntity> findByConversationIdOrderBySentAtDesc(@Param("conversationId") String conversationId);

    @Query("SELECT m FROM MessageEntity m WHERE m.conversationId = :conversationId AND m.isDeleted = false ORDER BY m.sentAt DESC LIMIT :limit")
    List<MessageEntity> findRecentMessagesByConversation(@Param("conversationId") String conversationId, @Param("limit") int limit);
}
