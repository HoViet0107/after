package personal.social.message.application.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import personal.social.message.application.dto.UserPresence;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Service for managing user presence status in real-time.
 * <p>
 * This service handles user connection and disconnection events,
 * updating their presence status in Redis and broadcasting changes
 * to connected clients using messaging templates.
 */
@Service
public class PresenceService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceService(RedisTemplate<String, Object> redisTemplate,
                           SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    public void userConnected(String userId, String sessionId, String username) {
        // Store user session mapping
        redisTemplate.opsForValue().set(
                "session:" + sessionId,
                userId,
                Duration.ofHours(24)
        );

        // Add user to online set
        redisTemplate.opsForSet().add("online:users", userId);

        // Store user details
        UserPresence presence = new UserPresence(
                userId,
                username,
                true,
                LocalDateTime.now()
        );

        redisTemplate.opsForValue().set(
                "presence:" + userId,
                presence,
                Duration.ofHours(24)
        );

        // Broadcast presence change
        PresenceEvent event = new PresenceEvent(
                userId,
                username,
                true,
                LocalDateTime.now()
        );

        messagingTemplate.convertAndSend("/topic/presence", event);

        // Publish to Redis for cross-server broadcasting
        redisTemplate.convertAndSend("user.presence.online", event);
    }

    public void userDisconnected(String sessionId) {
        String userId = (String) redisTemplate.opsForValue().get("session:" + sessionId);

        if (userId != null) {
            // Check if user has other active sessions
            Set<String> sessionKeys = redisTemplate.keys("session:*");
            boolean hasOtherSessions = sessionKeys.stream()
                    .anyMatch(key -> {
                        String userIdForSession = (String) redisTemplate.opsForValue().get(key);
                        return userId.equals(userIdForSession) && !key.equals("session:" + sessionId);
                    });

            if (!hasOtherSessions) {
                // Remove from online users
                redisTemplate.opsForSet().remove("online:users", userId);

                // Update presence
                UserPresence presence = (UserPresence) redisTemplate.opsForValue()
                        .get("presence:" + userId);

                if (presence != null) {
                    UserPresence offlinePresence = new UserPresence(
                            userId,
                            presence.username(),
                            false,
                            LocalDateTime.now()
                    );

                    redisTemplate.opsForValue().set(
                            "presence:" + userId,
                            offlinePresence,
                            Duration.ofDays(7) // Keep offline status longer
                    );

                    PresenceEvent event = new PresenceEvent(
                            userId,
                            presence.username(),
                            false,
                            LocalDateTime.now()
                    );

                    messagingTemplate.convertAndSend("/topic/presence", event);
                    redisTemplate.convertAndSend("user.presence.offline", event);
                }
            }

            // Remove session
            redisTemplate.delete("session:" + sessionId);
        }
    }

    public boolean isUserOnline(String userId) {
        return redisTemplate.opsForSet().isMember("online:users", userId);
    }

    public Set<Object> getOnlineUsers() {
        return redisTemplate.opsForSet().members("online:users");
    }
}
