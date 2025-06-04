package personal.social.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import personal.social.dto.websocket.WebSocketSession;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisWebSocketSessionManager {

    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    private static final String USER_SESSIONS_KEY = "ws:user:sessions:%s";
    private static final String SESSION_USER_KEY = "ws:session:user:%s";
    private static final String CONVERSATION_SESSIONS_KEY = "ws:conversation:sessions:%s";
    private static final String SESSION_INFO_KEY = "ws:session:info:%s";
    private static final String USER_STATUS_KEY = "ws:user:status:%s";
    private static final Duration SESSION_TTL = Duration.ofHours(24);

    // Session Management
    public void addSession(String sessionId, String userEmail, WebSocketSession sessionInfo) {
        try {
            // Store session info
            redisService.hSet(String.format(SESSION_INFO_KEY, sessionId), "sessionInfo", sessionInfo);
            redisService.expire(String.format(SESSION_INFO_KEY, sessionId), SESSION_TTL);

            // Map session to user
            redisService.set(String.format(SESSION_USER_KEY, sessionId), userEmail, SESSION_TTL);

            // Add session to user's session set
            redisService.sAdd(String.format(USER_SESSIONS_KEY, userEmail), sessionId);
            redisService.expire(String.format(USER_SESSIONS_KEY, userEmail), SESSION_TTL);

            // Update user status
            updateUserStatus(userEmail, true);

            log.info("Added WebSocket session {} for user {}", sessionId, userEmail);
        } catch (Exception e) {
            log.error("Error adding WebSocket session: {}", e.getMessage(), e);
        }
    }

    public void removeSession(String sessionId) {
        try {
            // Get user email before removing session
            String userEmail = redisService.get(String.format(SESSION_USER_KEY, sessionId), String.class);

            if (userEmail != null) {
                // Remove session from user's session set
                redisService.sRemove(String.format(USER_SESSIONS_KEY, userEmail), sessionId);

                // Remove from all conversations
                removeSessionFromAllConversations(sessionId);

                // Check if user has other active sessions
                Set<Object> userSessions = redisService.sMembers(String.format(USER_SESSIONS_KEY, userEmail));
                if (userSessions.isEmpty()) {
                    updateUserStatus(userEmail, false);
                }

                // Clean up session data
                redisService.delete(String.format(SESSION_USER_KEY, sessionId));
                redisService.delete(String.format(SESSION_INFO_KEY, sessionId));

                log.info("Removed WebSocket session {} for user {}", sessionId, userEmail);
            }
        } catch (Exception e) {
            log.error("Error removing WebSocket session: {}", e.getMessage(), e);
        }
    }

    // Conversation Management
    public void joinConversation(String sessionId, Long conversationId) {
        try {
            redisService.sAdd(String.format(CONVERSATION_SESSIONS_KEY, conversationId), sessionId);
            log.debug("Session {} joined conversation {}", sessionId, conversationId);
        } catch (Exception e) {
            log.error("Error joining conversation: {}", e.getMessage(), e);
        }
    }

    public void leaveConversation(String sessionId, Long conversationId) {
        try {
            redisService.sRemove(String.format(CONVERSATION_SESSIONS_KEY, conversationId), sessionId);
            log.debug("Session {} left conversation {}", sessionId, conversationId);
        } catch (Exception e) {
            log.error("Error leaving conversation: {}", e.getMessage(), e);
        }
    }

    // User Status Management
    public void updateUserStatus(String userEmail, boolean isOnline) {
        try {
            if (isOnline) {
                redisService.hSet(String.format(USER_STATUS_KEY, userEmail), "isOnline", true);
                redisService.hSet(String.format(USER_STATUS_KEY, userEmail), "lastSeen", LocalDateTime.now());
            } else {
                redisService.hSet(String.format(USER_STATUS_KEY, userEmail), "isOnline", false);
                redisService.hSet(String.format(USER_STATUS_KEY, userEmail), "lastSeen", LocalDateTime.now());
            }
            redisService.expire(String.format(USER_STATUS_KEY, userEmail), Duration.ofDays(7));
        } catch (Exception e) {
            log.error("Error updating user status: {}", e.getMessage(), e);
        }
    }

    // Query Methods
    public Set<Object> getUserSessions(String userEmail) {
        return redisService.sMembers(String.format(USER_SESSIONS_KEY, userEmail));
    }

    public Set<Object> getConversationSessions(Long conversationId) {
        return redisService.sMembers(String.format(CONVERSATION_SESSIONS_KEY, conversationId));
    }

    public String getSessionUser(String sessionId) {
        return redisService.get(String.format(SESSION_USER_KEY, sessionId), String.class);
    }

    public boolean isUserOnline(String userEmail) {
        return redisService.hGet(String.format(USER_STATUS_KEY, userEmail), "isOnline", Boolean.class) == Boolean.TRUE;
    }

    public LocalDateTime getUserLastSeen(String userEmail) {
        return redisService.hGet(String.format(USER_STATUS_KEY, userEmail), "lastSeen", LocalDateTime.class);
    }

    // Utility Methods
    private void removeSessionFromAllConversations(String sessionId) {
        // Note: In a real implementation, you might want to track which conversations
        // a session is part of to avoid scanning all conversation keys
        // For now, this is a simplified approach
        log.debug("Removing session {} from all conversations", sessionId);
    }

    // Cleanup Methods
    public void cleanupExpiredSessions() {
        try {
            // This would be called by a scheduled task
            log.debug("Cleaning up expired WebSocket sessions");
            // Implementation depends on your specific cleanup strategy
        } catch (Exception e) {
            log.error("Error during session cleanup: {}", e.getMessage(), e);
        }
    }
}
