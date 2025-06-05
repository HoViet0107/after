package personal.social.messaging.application.service;

import personal.social.messaging.domain.model.*;
import personal.social.messaging.domain.port.MessageRepository;
import personal.social.messaging.application.dto.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RealTimeChatService {

    private final MessageRepository messageRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;

    public RealTimeChatService(MessageRepository messageRepository,
                               RedisTemplate<String, Object> redisTemplate,
                               SimpMessagingTemplate messagingTemplate,
                               PresenceService presenceService) {
        this.messageRepository = messageRepository;
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.presenceService = presenceService;
    }

    public SendMessageResponse sendMessage(SendMessageRequest request) {
        // 1. Create domain object
        ChatMessage message = ChatMessage.create(
                MessageId.generate(),
                ConversationId.of(request.conversationId()),
                UserId.of(request.senderId()),
                MessageContent.of(request.content()),
                MessageType.valueOf(request.type()),
                request.replyToId() != null ? MessageId.of(request.replyToId()) : null
        );

        // 2. Save to database
        ChatMessage savedMessage = messageRepository.save(message);

        // 3. Publish to Redis for cross-server broadcasting
        MessageEvent messageEvent = new MessageEvent(
                savedMessage.getId().value(),
                savedMessage.getConversationId().value(),
                savedMessage.getSenderId().value(),
                savedMessage.getContent().text(),
                savedMessage.getType().name(),
                savedMessage.getTimestamp(),
                savedMessage.getReplyToId() != null ? savedMessage.getReplyToId().value() : null
        );

        String channel = "chat.message." + savedMessage.getConversationId().value();
        redisTemplate.convertAndSend(channel, messageEvent);

        // 4. Send to local WebSocket clients
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + savedMessage.getConversationId().value(),
                messageEvent
        );

        return new SendMessageResponse(
                savedMessage.getId().value(),
                savedMessage.getTimestamp(),
                savedMessage.getStatus().name()
        );
    }

    public void markMessageAsRead(String messageId, String userId) {
        MessageId msgId = MessageId.of(messageId);
        UserId uId = UserId.of(userId);

        ChatMessage message = messageRepository.findById(msgId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found: " + messageId));

        message.markAsRead();
        messageRepository.save(message);

        // Notify sender that message was read
        ReadReceiptEvent readReceipt = new ReadReceiptEvent(
                messageId,
                userId,
                LocalDateTime.now()
        );

        String channel = "chat.read." + message.getConversationId().value();
        redisTemplate.convertAndSend(channel, readReceipt);
    }
}
