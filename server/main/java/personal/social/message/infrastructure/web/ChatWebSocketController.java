package personal.social.message.infrastructure.web;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import personal.social.message.application.dto.in.*;
import personal.social.message.application.service.PresenceService;
import personal.social.message.application.service.RealTimeChatService;
import personal.social.message.application.service.TypingIndicatorService;
import personal.social.shared.infrastructure.security.RateLimit;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final RealTimeChatService chatService;
    private final TypingIndicatorService typingService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    @RateLimit(limit = 30, windowSeconds = 60)
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        try {
            // Override sender with authenticated user
            SendMessageRequest authenticatedRequest = new SendMessageRequest(
                    request.conversationId(),
                    principal.getName(),
                    request.content(),
                    request.type(),
                    request.replyToId()
            );

            chatService.sendMessage(authenticatedRequest);
            log.info("Message sent by user: {} to conversation: {}", principal.getName(), request.conversationId());

        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);

            // Send error back to user
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to send message: " + e.getMessage()
            );
        }
    }

    @MessageMapping("/chat.typing.start")
    @RateLimit(limit = 60, windowSeconds = 60)
    public void startTyping(@Payload TypingRequest request, Principal principal) {
        try {
            typingService.userStartedTyping(
                    request.conversationId(),
                    principal.getName(),
                    request.username()
            );
        } catch (Exception e) {
            log.error("Error handling typing start: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.typing.stop")
    public void stopTyping(@Payload TypingRequest request, Principal principal) {
        try {
            typingService.userStoppedTyping(
                    request.conversationId(),
                    principal.getName(),
                    request.username()
            );
        } catch (Exception e) {
            log.error("Error handling typing stop: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.join")
    public void joinConversation(@Payload JoinConversationRequest request,
                                 SimpMessageHeaderAccessor headerAccessor,
                                 Principal principal) {
        try {
            // Store conversation in session for cleanup
            headerAccessor.getSessionAttributes().put("conversationId", request.conversationId());
            headerAccessor.getSessionAttributes().put("userId", principal.getName());

            presenceService.userConnected(
                    principal.getName(),
                    headerAccessor.getSessionId(),
                    request.username()
            );

            // Send join confirmation
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/join-confirmation",
                    "Joined conversation: " + request.conversationId()
            );

            log.info("User {} joined conversation: {}", principal.getName(), request.conversationId());

        } catch (Exception e) {
            log.error("Error joining conversation: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.read")
    @RateLimit(limit = 100, windowSeconds = 60)
    public void markAsRead(@Payload ReadMessageRequest request, Principal principal) {
        try {
            chatService.markMessageAsRead(request.messageId(), principal.getName());
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage(), e);
        }
    }

    @SubscribeMapping("/conversation/{conversationId}")
    public String subscribeToConversation(@DestinationVariable String conversationId, Principal principal) {
        log.info("User {} subscribed to conversation: {}", principal.getName(), conversationId);
        return "Subscribed to conversation: " + conversationId;
    }

    @SubscribeMapping("/user/queue/errors")
    public String subscribeToErrors(Principal principal) {
        log.info("User {} subscribed to error queue", principal.getName());
        return "Subscribed to error notifications";
    }
}