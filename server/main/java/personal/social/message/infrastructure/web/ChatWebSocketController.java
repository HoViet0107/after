package personal.social.message.infrastructure.web;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import personal.social.message.application.dto.in.JoinConversationRequest;
import personal.social.message.application.dto.in.ReadMessageRequest;
import personal.social.message.application.dto.in.SendMessageRequest;
import personal.social.message.application.dto.in.TypingRequest;
import personal.social.message.application.service.PresenceService;
import personal.social.message.application.service.RealTimeChatService;
import personal.social.message.application.service.TypingIndicatorService;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    private final RealTimeChatService chatService;
    private final TypingIndicatorService typingService;
    private final PresenceService presenceService;

    public ChatWebSocketController(RealTimeChatService chatService,
                                   TypingIndicatorService typingService,
                                   PresenceService presenceService) {
        this.chatService = chatService;
        this.typingService = typingService;
        this.presenceService = presenceService;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        request = new SendMessageRequest(
                request.conversationId(),
                principal.getName(), // Use authenticated user ID
                request.content(),
                request.type(),
                request.replyToId()
        );

        chatService.sendMessage(request);
    }

    @MessageMapping("/chat.typing.start")
    public void startTyping(@Payload TypingRequest request, Principal principal) {
        typingService.userStartedTyping(
                request.conversationId(),
                principal.getName(),
                request.username()
        );
    }

    @MessageMapping("/chat.typing.stop")
    public void stopTyping(@Payload TypingRequest request, Principal principal) {
        typingService.userStoppedTyping(
                request.conversationId(),
                principal.getName(),
                request.username()
        );
    }

    @MessageMapping("/chat.join")
    public void joinConversation(@Payload JoinConversationRequest request,
                                 SimpMessageHeaderAccessor headerAccessor,
                                 Principal principal) {
        // Store conversation in session for cleanup
        headerAccessor.getSessionAttributes().put("conversationId", request.conversationId());
        headerAccessor.getSessionAttributes().put("userId", principal.getName());

        presenceService.userConnected(
                principal.getName(),
                headerAccessor.getSessionId(),
                request.username()
        );
    }

    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ReadMessageRequest request, Principal principal) {
        chatService.markMessageAsRead(request.messageId(), principal.getName());
    }
}
