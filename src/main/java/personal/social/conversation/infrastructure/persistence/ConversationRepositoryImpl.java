package personal.social.conversation.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import personal.social.conversation.domain.model.Conversation;
import personal.social.conversation.domain.model.ConversationParticipant;
import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.conversation.domain.model.vo.ConversationTitle;
import personal.social.conversation.domain.repository.ConversationRepository;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ConversationRepositoryImpl implements ConversationRepository {

    private final ConversationJpaRepository jpaRepository;

    @Override
    public Conversation save(Conversation conversation) {
        ConversationEntity entity = toEntity(conversation);
        ConversationEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Conversation> findById(ConversationId id) {
        return jpaRepository.findById(id.value())
                .map(this::toDomain);
    }

    @Override
    public List<Conversation> findByParticipant(UserId userId) {
        return jpaRepository.findByParticipantsUserId(userId.value())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Conversation> findDirectMessageBetween(UserId user1, UserId user2) {
        return jpaRepository.findDirectMessageBetween(user1.value(), user2.value())
                .map(this::toDomain);
    }

    @Override
    public void delete(ConversationId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(ConversationId id) {
        return jpaRepository.existsById(id.value());
    }

    @Override
    public List<String> findPopularConversationIds() {
        return List.of();
    }

    // Mapping methods
    private ConversationEntity toEntity(Conversation conversation) {
        ConversationEntity entity = ConversationEntity.builder()
                .id(conversation.getId().value())
                .title(conversation.getTitle().value())
                .avatarUrl(conversation.getAvatarUrl())
                .isGroupChat(conversation.isGroupChat())
                .createdAt(conversation.getCreatedAt())
                .editedAt(conversation.getEditedAt())
                .lastMessageId(conversation.getLastMessageId())
                .build();

        // Map participants
        Set<ConversationParticipantEntity> participantEntities = conversation.getParticipants()
                .stream()
                .map(participant -> ConversationParticipantEntity.builder()
                        .conversationId(participant.getConversationId().value())
                        .userId(participant.getUserId().value())
                        .role(participant.getRole())
                        .joinedAt(participant.getJoinedAt())
                        .isOnline(participant.isOnline())
                        .isActive(participant.isActive())
                        .build())
                .collect(Collectors.toSet());

        entity.setParticipants(participantEntities);
        return entity;
    }

    private Conversation toDomain(ConversationEntity entity) {
        // Convert participants
        Set<ConversationParticipant> participants = entity.getParticipants()
                .stream()
                .map(participantEntity -> ConversationParticipant.builder()
                        .conversationId(ConversationId.of(participantEntity.getConversationId()))
                        .userId(UserId.of(participantEntity.getUserId()))
                        .role(participantEntity.getRole())
                        .joinedAt(participantEntity.getJoinedAt())
                        .isOnline(participantEntity.isOnline())
                        .isActive(participantEntity.isActive())
                        .build())
                .collect(Collectors.toSet());

        return Conversation.builder()
                .id(ConversationId.of(entity.getId()))
                .title(ConversationTitle.of(entity.getTitle()))
                .avatarUrl(entity.getAvatarUrl())
                .isGroupChat(entity.isGroupChat())
                .createdAt(entity.getCreatedAt())
                .editedAt(entity.getEditedAt())
                .lastMessageId(entity.getLastMessageId())
                .participants(participants)
                .build();
    }
}
