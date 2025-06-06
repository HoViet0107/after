package personal.social.message.domain.repository;

import personal.social.message.domain.model.ChatMessage;
import personal.social.message.domain.model.vo.MessageId;

import java.util.Optional;

public interface MessageRepository {
    ChatMessage save(ChatMessage message);

    Optional<ChatMessage> findById(MessageId msgId);


}
