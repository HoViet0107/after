package personal.social.message.domain.repository;

import personal.social.message.domain.model.ChatMessage;
import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;

import java.util.List;
import java.util.Optional;

public interface MessageRepository {
    ChatMessage save(ChatMessage message);
    Optional<ChatMessage> findById(MessageId id);
    List<ChatMessage> findByConversation(ConversationId conversationId);
    void delete(MessageId id);
}