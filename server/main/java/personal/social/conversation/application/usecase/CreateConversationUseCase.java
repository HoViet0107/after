package personal.social.conversation.application.usecase;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.conversation.application.dto.in.CreateConversationRequest;
import personal.social.conversation.application.dto.out.ConversationResponse;
import personal.social.conversation.domain.event.ConversationEventPublisher;
import personal.social.conversation.domain.model.Conversation;
import personal.social.conversation.domain.model.vo.ConversationId;
import personal.social.conversation.domain.model.vo.ConversationTitle;
import personal.social.conversation.domain.repository.ConversationRepository;
import personal.social.user.domain.model.vo.UserId;

import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateConversationUseCase {

    private final ConversationRepository conversationRepository;
    private final ConversationEventPublisher eventPublisher;

    public ConversationResponse execute(CreateConversationRequest request) {
        // Check if direct message already exists
        if (!request.isGroupChat() && request.participantIds().size() == 1) {
            UserId currentUser = UserId.of(request.createdBy());
            UserId otherUser = UserId.of(request.participantIds().getFirst());

            Optional<Conversation> existing = conversationRepository
                    .findDirectMessageBetween(currentUser, otherUser);

            if (existing.isPresent()) {
                return ConversationResponse.from(existing.get());
            }
        }

        // Create new conversation
        Conversation conversation;
        ConversationId id = ConversationId.generate();
        UserId createdBy = UserId.of(request.createdBy());

        if (request.isGroupChat()) {
            conversation = Conversation.createGroupChat(
                    id,
                    ConversationTitle.of(request.title()),
                    request.avatarUrl(),
                    createdBy
            );

            // Add other participants
            request.participantIds().forEach(participantId -> {
                if (!participantId.equals(request.createdBy())) {
                    conversation.addParticipant(
                            UserId.of(participantId),
                            personal.social.conversation.domain.model.vo.ParticipantRole.PARTICIPANT,
                            createdBy
                    );
                }
            });
        } else {
            conversation = Conversation.createDirectMessage(
                    id,
                    createdBy,
                    UserId.of(request.participantIds().getFirst())
            );
        }

        // Save and publish events
        Conversation savedConversation = conversationRepository.save(conversation);
        eventPublisher.publishEvents(savedConversation.getDomainEvents());
        savedConversation.clearDomainEvents();

        return ConversationResponse.from(savedConversation);
    }
}
