package personal.social.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import personal.social.services.CachingService;
import personal.social.services.MessageService;
import personal.social.dto.message.ChatMessageDTO;
import personal.social.dto.CursorResponse;
import personal.social.dto.message.ReactionDTO;
import personal.social.model.Users;
import personal.social.repository.*;
import personal.social.helper.MessageHelper;
import personal.social.helper.Utilities;
import personal.social.services.RedisWebSocketSessionManager;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationRepository conversationRepository;
    private final MessageMediaRepository mediaRepository;
    private final MessageReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final MessageReadStatusRepository readStatusRepository;

    private final CachingService cachingService;
    private final RedisWebSocketSessionManager sessionManager;
    private final MessageAsyncService messageAsyncService;

    @Override
    @Transactional(readOnly = true)
    public CursorResponse<ChatMessageDTO> getMessagesForConversation(
            Long conversationId, Long userId, LocalDateTime cursor, int size) throws AccessDeniedException {

        // Validate access
        if (!Utilities.isUserHasAccessToConversation(userId, conversationId, participantRepository)) {
            throw new AccessDeniedException("User does not have access to this conversation");
        }

        // Try cache first for recent messages
        if (cursor == null) {
            List<ChatMessageDTO> cachedMessages = cachingService.getCachedMessages(conversationId, 0, size);
            if (!cachedMessages.isEmpty()) {
                log.debug("Retrieved {} messages from cache for conversation {}", cachedMessages.size(), conversationId);
                return buildCursorResponse(cachedMessages, size);
            }
        }

        // Fetch from database
        var messageProjections = messageRepository.findMessagesWithDetailsForConversation(
                conversationId,
                cursor != null ? java.sql.Timestamp.valueOf(cursor) : null,
                size);

        if (messageProjections.isEmpty()) {
            return new CursorResponse<>(List.of(),0, null, false);
        }

        // Process messages asynchronously
        CompletableFuture<List<ChatMessageDTO>> messagesFuture = CompletableFuture.supplyAsync(() ->
                processMessages(messageProjections, userId));

        try {
            List<ChatMessageDTO> messages = messagesFuture.get();

            // Cache the results if it's the first page
            if (cursor == null && !messages.isEmpty()) {
                cachingService.cacheMessages(messages, conversationId);
            }

            // Mark messages as read asynchronously
            messageAsyncService.markMessagesAsReadAsync(readStatusRepository, userId, messages);

            return buildCursorResponse(messages, size);

        } catch (Exception e) {
            log.error("Error processing messages for conversation {}: {}", conversationId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve messages", e);
        }
    }

    @Override
    @Transactional
    public ChatMessageDTO sendMessage(ChatMessageDTO request, Users sender, MultipartFile file)
            throws AccessDeniedException {

        // Validate access
        if (!Utilities.isUserHasAccessToConversation(sender.getId(), request.getConversationId(), participantRepository)) {
            throw new AccessDeniedException("User does not have access to this conversation");
        }

        // Create and save message
        var message = createMessage(request, sender);
        var savedMessage = messageRepository.save(message);

        // Update conversation
        updateConversationLastMessage(savedMessage);

        // Handle media if present
        if (file != null && !file.isEmpty()) {
            // Process media upload asynchronously
            CompletableFuture.runAsync(() -> processMediaUpload(savedMessage, file));
        }

        // Convert to DTO
        ChatMessageDTO messageDTO = MessageHelper.convertToChatMessageDTO(savedMessage);

        // Cache the new message
        cachingService.cacheMessage(messageDTO);

        // Invalidate conversation messages cache
        cachingService.evictConversationMessages(request.getConversationId());

        // Broadcast via WebSocket asynchronously
        CompletableFuture.runAsync(() -> broadcastMessage(messageDTO));

        return messageDTO;
    }

    // ... other service methods with similar optimizations

    private List<ChatMessageDTO> processMessages(List<personal.social.dto.message.MessageProjection> projections, Long userId) {
        // Extract IDs for batch loading
        List<Long> messageIds = projections.stream()
                .map(personal.social.dto.message.MessageProjection::getId)
                .toList();

        // Load related data in parallel
        var mediaMap = MessageHelper.loadMediaForMessages(mediaRepository, messageIds);
        var reactionMap = MessageHelper.loadReactionsForMessages(reactionRepository, messageIds);
        var readStatusMap = MessageHelper.loadReadStatusForMessages(readStatusRepository, messageIds, userId);

        // Build DTOs
        return projections.stream()
                .map(projection -> MessageHelper.buildChatMessageDTO(projection, mediaMap, reactionMap, readStatusMap))
                .toList();
    }

    private personal.social.model.Messages createMessage(ChatMessageDTO request, Users sender) {
        return personal.social.model.Messages.builder()
                .sentAt(LocalDateTime.now())
                .messageContent(request.getContent())
                .messageStatus(request.getStatus().name())
                .sender(sender)
                .conversation(conversationRepository.findById(request.getConversationId()).orElseThrow())
                .replyToMessageId(request.getReplyToMessageId())
                .build();
    }

    private void updateConversationLastMessage(personal.social.model.Messages message) {
        var conversation = message.getConversation();
        conversation.setLastMessageId(message.getId());
        conversation.setEditedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Evict conversation cache
        cachingService.evictConversation(conversation.getId());
    }

    private void processMediaUpload(personal.social.model.Messages message, MultipartFile file) {
        try {
            // TODO: Implement media upload logic
            log.debug("Processing media upload for message {}", message.getId());
        } catch (Exception e) {
            log.error("Error processing media upload: {}", e.getMessage(), e);
        }
    }

    private void broadcastMessage(ChatMessageDTO messageDTO) {
        try {
            MessageHelper.broadcastNewMessage(messageDTO, null); // Updated to use Redis session manager
            log.debug("Broadcasted message {} to conversation {}", messageDTO.getId(), messageDTO.getConversationId());
        } catch (Exception e) {
            log.error("Error broadcasting message: {}", e.getMessage(), e);
        }
    }

    private CursorResponse<ChatMessageDTO> buildCursorResponse(List<ChatMessageDTO> messages, int requestedSize) {
        LocalDateTime nextCursor = null;
        boolean hasNext = messages.size() == requestedSize;

        if (!messages.isEmpty()) {
            nextCursor = messages.get(messages.size() - 1).getSendAt();
        }

        return CursorResponse.<ChatMessageDTO>builder()
                .data(messages)
                .nextCursor(nextCursor)
                .hasNext(hasNext)
                .totalCount(messages.size())
                .build();
    }

    // Implement other required methods...
    @Override
    public void deleteMessage(Long messageId, Long userId) throws AccessDeniedException {
        // Implementation with cache invalidation
    }

    @Override
    public ChatMessageDTO editMessage(Long messageId, String newContent, Long userId) throws AccessDeniedException {
        // Implementation with cache update
        return null;
    }

    @Override
    public ReactionDTO addReaction(Long messageId, String reactionType, Long userId) {
        // Implementation with cache update
        return null;
    }

    @Override
    public void removeReaction(Long messageId, Long userId) {
        // Implementation with cache update
    }
}
