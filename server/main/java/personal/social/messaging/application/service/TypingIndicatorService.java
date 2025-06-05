package personal.social.messaging.application.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import personal.social.messaging.application.dto.TypingIndicator;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;

@Service
public class TypingIndicatorService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public TypingIndicatorService(RedisTemplate<String, Object> redisTemplate,
                                  SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    public void userStartedTyping(String conversationId, String userId, String username) {
        String key = "typing:" + conversationId + ":" + userId;

        TypingIndicator indicator = new TypingIndicator(
                conversationId,
                userId,
                username,
                true,
                LocalDateTime.now()
        );

        // Store in Redis with TTL
        redisTemplate.opsForValue().set(key, indicator, Duration.ofSeconds(5));

        // Broadcast to conversation participants
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/typing",
                indicator
        );

        // Publish to Redis for cross-server broadcasting
        String channel = "chat.typing." + conversationId;
        redisTemplate.convertAndSend(channel, indicator);
    }

    public void userStoppedTyping(String conversationId, String userId, String username) {
        String key = "typing:" + conversationId + ":" + userId;
        redisTemplate.delete(key);

        TypingIndicator indicator = new TypingIndicator(
                conversationId,
                userId,
                username,
                false,
                LocalDateTime.now()
        );

        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/typing",
                indicator
        );

        String channel = "chat.typing." + conversationId;
        redisTemplate.convertAndSend(channel, indicator);
    }

    @Scheduled(fixedRate = 3000) // Every 3 seconds
    public void cleanupExpiredTypingIndicators() {
        Set<String> typingKeys = redisTemplate.keys("typing:*");

        for (String key : typingKeys) {
            if (!redisTemplate.hasKey(key)) {
                // Extract conversation and user info from key
                String[] parts = key.split(":");
                if (parts.length >= 3) {
                    String conversationId = parts[1];
                    String userId = parts[2];

                    TypingIndicator stopIndicator = new TypingIndicator(
                            conversationId,
                            userId,
                            "",
                            false,
                            LocalDateTime.now()
                    );

                    messagingTemplate.convertAndSend(
                            "/topic/conversation/" + conversationId + "/typing",
                            stopIndicator
                    );
                }
            }
        }
    }
}
