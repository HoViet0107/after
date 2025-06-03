package personal.social.controllers.websocket;

import lombok.RequiredArgsConstructor;
import personal.social.dto.message.MessageDTO;
import personal.social.helper.Utilities;
import personal.social.model.Users;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import personal.social.services.MessageService;
import personal.social.services.WebSocketService;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final MessageService messageService;
    private final WebSocketService webSocketService;

    /**
     * Xử lý khi người dùng gửi tin nhắn
     */
    @MessageMapping("/conversation/{conversationId}/sendMessage")
    public void sendMessage(@DestinationVariable Long conversationId,
                            @Payload MessageDTO messageDto,
                            @AuthenticationPrincipal Users currentUser) {
        // Set sender information
        messageDto.setSenderId(currentUser.getId());
        messageDto.setSenderName(Utilities.buildFullName(currentUser));
        messageDto.setConversationId(conversationId);

        // Save message to DB and send to WebSocket clients
        MessageDTO savedMessage = messageService.saveMessage(messageDto, currentUser);
        webSocketService.sendNewMessage(savedMessage);
    }

    /**
     * Xử lý khi người dùng tham gia cuộc trò chuyện
     */
    @MessageMapping("/conversation/{conversationId}/join")
    public void joinConversation(@DestinationVariable Long conversationId,
                                 @AuthenticationPrincipal Users currentUser,
                                 SimpMessageHeaderAccessor headerAccessor) {
        // Lưu conversationId vào session để theo dõi
        headerAccessor.getSessionAttributes().put("conversationId", conversationId);
        headerAccessor.getSessionAttributes().put("username", currentUser.getUsername());

        // Đánh dấu người dùng đã tham gia cuộc trò chuyện
        webSocketService.userJoinedConversation(conversationId, currentUser.getUsername());
    }
}