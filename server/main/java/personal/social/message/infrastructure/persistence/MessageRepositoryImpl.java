package personal.social.message.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import personal.social.message.domain.model.ChatMessage;
import personal.social.message.domain.model.MessageContent;
import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;
import personal.social.message.domain.repository.MessageRepository;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MessageRepositoryImpl implements MessageRepository {

    private final MessageJpaRepository jpaRepository;

    @Override
    public ChatMessage save(ChatMessage message) {
        MessageEntity entity = toEntity(message);
        MessageEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<ChatMessage> findById(MessageId id) {
        return jpaRepository.findById(id.value())
                .map(this::toDomain);
    }

    @Override
    public List<ChatMessage> findByConversation(ConversationId conversationId) {
        return jpaRepository.findByConversationIdOrderByTimestampDesc(conversationId.value())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void delete(MessageId id) {
        jpaRepository.deleteById(id.value());
    }

    // Mapping methods
    private MessageEntity toEntity(ChatMessage message) {
        return MessageEntity.builder()
                .id(message.getId().value())
                .conversationId(message.getConversationId().value())
                .senderId(message.getSenderId().value())
                .content(message.getContent().text())
                .type(message.getType())
                .sentAt(message.getSentAt())
                .editedAt(message.getEditedAt())
                .replyToId(message.getReplyToId() != null ? message.getReplyToId().value() : null)
                .status(message.getStatus())
                .isDeleted(message.isDeleted())
                .build();
    }

    private ChatMessage toDomain(MessageEntity entity) {
        return ChatMessage.builder()
                .id(MessageId.of(entity.getId()))
                .conversationId(ConversationId.of(entity.getConversationId()))
                .senderId(UserId.of(entity.getSenderId()))
                .content(MessageContent.of(entity.getContent()))
                .type(entity.getType())
                .sentAt(entity.getSentAt())
                .editedAt(entity.getEditedAt())
                .replyToId(entity.getReplyToId() != null ? MessageId.of(entity.getReplyToId()) : null)
                .status(entity.getStatus())
                .isDeleted(entity.isDeleted())
                .build();
    }
}
