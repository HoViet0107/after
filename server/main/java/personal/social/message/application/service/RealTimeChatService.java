package personal.social.message.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import personal.social.feed.application.dto.in.MediaMessageRequest;
import personal.social.message.application.dto.in.ConversationHistoryRequest;
import personal.social.message.application.dto.in.SendMessageRequest;
import personal.social.message.application.dto.out.ConversationHistoryResponse;
import personal.social.message.application.dto.out.SendMessageResponse;
import personal.social.message.domain.model.*;
import personal.social.message.domain.model.enums.MessageType;
import personal.social.message.domain.model.vo.ConversationId;
import personal.social.message.domain.model.vo.MessageId;
import personal.social.message.domain.repository.MessageRepository;
import personal.social.message.application.dto.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.user.domain.model.vo.UserId;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class RealTimeChatService {

    private final MessageRepository messageRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public SendMessageResponse sendMessage(SendMessageRequest request) {
        try {
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

            // 3. Cache recent message
            cacheRecentMessage(savedMessage);

            // 4. Create message event
            MessageEvent messageEvent = new MessageEvent(
                    savedMessage.getId().value(),
                    savedMessage.getConversationId().value(),
                    savedMessage.getSenderId().value(),
                    savedMessage.getContent().text(),
                    savedMessage.getType().name(),
                    savedMessage.getSentAt(),
                    savedMessage.getReplyToId() != null ? savedMessage.getReplyToId().value() : null
            );

            // 5. Publish to Redis for cross-server broadcasting (async)
            String channel = "chat.message." + savedMessage.getConversationId().value();
            redisTemplate.convertAndSend(channel, messageEvent);

            // 6. Send to local WebSocket clients immediately
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + savedMessage.getConversationId().value(),
                    messageEvent
            );

            // 7. Update conversation's last message
            updateConversationLastMessage(savedMessage.getConversationId().value(), savedMessage.getId().value());

            log.info("Message sent successfully: {}", savedMessage.getId().value());

            return new SendMessageResponse(
                    savedMessage.getId().value(),
                    savedMessage.getSentAt(),
                    savedMessage.getStatus().name()
            );

        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send message", e);
        }
    }

    private void cacheRecentMessage(ChatMessage message) {
        String key = "recent:messages:" + message.getConversationId().value();

        // Store in Redis list, keep only last 50 messages
        redisTemplate.opsForList().leftPush(key, message);
        redisTemplate.opsForList().trim(key, 0, 49);
        redisTemplate.expire(key, Duration.ofHours(24));
    }

    private void updateConversationLastMessage(String conversationId, String messageId) {
        String key = "conversation:" + conversationId + ":last_message";
        redisTemplate.opsForValue().set(key, messageId, Duration.ofDays(30));
    }

    public void markMessageAsRead(String messageId, String userId) {
        try {
            MessageId msgId = MessageId.of(messageId);
            UserId uId = UserId.of(userId);

            ChatMessage message = messageRepository.findById(msgId)
                    .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));

            message.markAsRead(uId);
            messageRepository.save(message);

            // Cache read status
            String readKey = "message:" + messageId + ":read_by:" + userId;
            redisTemplate.opsForValue().set(readKey, LocalDateTime.now(), Duration.ofDays(7));

            log.info("Message marked as read: {} by user: {}", messageId, userId);

        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage(), e);
        }
    }

    public ConversationHistoryResponse getConversationHistory(ConversationHistoryRequest request) {
        return null;
    }

    public SendMessageResponse sendMediaMessage(MediaMessageRequest request) {
        return null;
    }
}