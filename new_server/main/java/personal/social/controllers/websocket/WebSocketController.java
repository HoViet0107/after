package personal.social.controllers.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.SendTo;
import personal.social.dto.message.ChatMessageDTO;
import personal.social.dto.websocket.WebSocketMessage;
import personal.social.helper.Utilities;
import personal.social.model.Users;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import personal.social.services.MessageService;
import personal.social.services.RedisWebSocketSessionManager;
import personal.social.services.WebSocketService;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {
    private final MessageService messageService;
    private final RedisWebSocketSessionManager sessionManager;

    @MessageMapping("/conversation/{conversationId}/send")
    @SendTo("/topic/conversation/{conversationId}/messages")
    public WebSocketMessage<ChatMessageDTO> sendMessage(
            @DestinationVariable Long conversationId,
            @Payload ChatMessageDTO messageDto,
            @AuthenticationPrincipal Users currentUser,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            // Validate and set sender information
            messageDto.setSenderId(currentUser.getId());
            messageDto.setSenderName(Utilities.buildFullName(currentUser));
            messageDto.setConversationId(conversationId);

            // Save message to database
            ChatMessageDTO savedMessage = messageService.sendMessage(messageDto, currentUser, null);

            // Create WebSocket response
            return WebSocketMessage.<ChatMessageDTO>builder()
                    .type(WebSocketEventType.MESSAGE_SENT)
                    .conversationId(conversationId)
                    .userId(currentUser.getId())
                    .userEmail(currentUser.getEmail())
                    .payload(savedMessage)
                    .sessionId(headerAccessor.getSessionId())
                    .build();

        } catch (Exception e) {
            log.error("Error sending message via WebSocket: {}", e.getMessage(), e);
            return WebSocketMessage.<ChatMessageDTO>builder()
                    .type(WebSocketEventType.MESSAGE_SENT)
                    .conversationId(conversationId)
                    .userId(currentUser.getId())
                    .userEmail(currentUser.getEmail())
                    .payload(null)
                    .build();
        }
    }

    @MessageMapping("/conversation/{conversationId}/join")
    public void joinConversation(
            @DestinationVariable Long conversationId,
            @AuthenticationPrincipal Users currentUser,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            String sessionId = headerAccessor.getSessionId();

            // Store conversation ID in session
            headerAccessor.getSessionAttributes().put("conversationId", conversationId);
            headerAccessor.getSessionAttributes().put("userEmail", currentUser.getEmail());

            // Add to Redis session manager
            sessionManager.joinConversation(sessionId, conversationId);

            log.info("User {} joined conversation {} with session {}",
                    currentUser.getEmail(), conversationId, sessionId);

        } catch (Exception e) {
            log.error("Error joining conversation via WebSocket: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/conversation/{conversationId}/leave")
    public void leaveConversation(
            @DestinationVariable Long conversationId,
            @AuthenticationPrincipal Users currentUser,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            String sessionId = headerAccessor.getSessionId();

            // Remove from Redis session manager
            sessionManager.leaveConversation(sessionId, conversationId);

            // Clean up session attributes
            headerAccessor.getSessionAttributes().remove("conversationId");

            log.info("User {} left conversation {} with session {}",
                    currentUser.getEmail(), conversationId, sessionId);

        } catch (Exception e) {
            log.error("Error leaving conversation via WebSocket: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/conversation/{conversationId}/typing")
    @SendTo("/topic/conversation/{conversationId}/events")
    public WebSocketMessage<String> userTyping(
            @DestinationVariable Long conversationId,
            @AuthenticationPrincipal Users currentUser) {

        return WebSocketMessage.<String>builder()
                .type(WebSocketEventType.USER_TYPING)
                .conversationId(conversationId)
                .userId(currentUser.getId())
                .userEmail(currentUser.getEmail())
                .payload(Utilities.buildFullName(currentUser) + " is typing...")
                .build();
    }

    @MessageMapping("/conversation/{conversationId}/stop-typing")
    @SendTo("/topic/conversation/{conversationId}/events")
    public WebSocketMessage<String> userStopTyping(
            @DestinationVariable Long conversationId,
            @AuthenticationPrincipal Users currentUser) {

        return WebSocketMessage.<String>builder()
                .type(WebSocketEventType.USER_STOP_TYPING)
                .conversationId(conversationId)
                .userId(currentUser.getId())
                .userEmail(currentUser.getEmail())
                .payload(Utilities.buildFullName(currentUser) + " stopped typing")
                .build();
    }

    @MessageMapping("/ping")
    @SendToUser("/queue/pong")
    public WebSocketMessage<String> handlePing(Principal principal) {
        return WebSocketMessage.<String>builder()
                .type(WebSocketEventType.USER_JOINED) // Repurpose for ping/pong
                .userEmail(principal.getName())
                .payload("pong")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public WebSocketMessage<String> handleException(Exception e, Principal principal) {
        log.error("WebSocket error for user {}: {}", principal.getName(), e.getMessage(), e);

        return WebSocketMessage.<String>builder()
                .userEmail(principal.getName())
                .payload("An error occurred: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
    }
}