package personal.social.config.socket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import personal.social.dto.websocket.WebSocketSession;
import personal.social.services.CachingService;
import personal.social.services.RedisWebSocketSessionManager;

import java.time.LocalDateTime;
/**
 * Manages WebSocket connection events for the application.
 * Handles session establishment and termination by tracking user connections
 * in Redis and updating online status in the cache. Maintains user session
 * information and ensures proper cleanup of resources when sessions disconnect.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final RedisWebSocketSessionManager sessionManager;
    private final CachingService cachingService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        try {
            // Get user information from session
            String userEmail = (String) headerAccessor.getSessionAttributes().get("userEmail");

            if (userEmail != null) {
                // Create session info
                WebSocketSession sessionInfo = WebSocketSession.builder()
                        .sessionId(sessionId)
                        .userEmail(userEmail)
                        .connectedAt(LocalDateTime.now())
                        .lastActivity(LocalDateTime.now())
                        .isActive(true)
                        .build();

                // Add to Redis session manager
                sessionManager.addSession(sessionId, userEmail, sessionInfo);

                // Update user online status in cache
                cachingService.addOnlineUser(userEmail);

                log.info("WebSocket connection established for user: {} with session: {}", userEmail, sessionId);
            }

        } catch (Exception e) {
            log.error("Error handling WebSocket connection: {}", e.getMessage(), e);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        try {
            // Get user email before removing session
            String userEmail = sessionManager.getSessionUser(sessionId);

            if (userEmail != null) {
                // Remove from Redis session manager
                sessionManager.removeSession(sessionId);

                // Check if user has other active sessions
                var userSessions = sessionManager.getUserSessions(userEmail);
                if (userSessions.isEmpty()) {
                    // Update user offline status in cache
                    cachingService.removeOnlineUser(userEmail);
                    sessionManager.updateUserStatus(userEmail, false);
                }

                log.info("WebSocket disconnection handled for user: {} with session: {}", userEmail, sessionId);
            }

        } catch (Exception e) {
            log.error("Error handling WebSocket disconnection: {}", e.getMessage(), e);
        }
    }
}
