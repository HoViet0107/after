package personal.social.controllers;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import personal.social.dto.message.ChatMessageDTO;
import personal.social.services.ChatMessageService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // WebSocket endpoints
    @MessageMapping("/chat.sendMessage/{conversationId}")
    @SendTo("/topic/chat/{conversationId}")
    public ChatMessageDTO sendMessage(@DestinationVariable Long conversationId,
                                      @Payload ChatMessageDTO chatMessageDto) {
        return chatMessageService.saveMessage(chatMessageDto);
    }

    @MessageMapping("/chat.markRead/{conversationId}")
    public void markRead(@DestinationVariable Long conversationId, Principal principal) {
        Long userId = Long.valueOf(principal.getName()); // Assuming principal name contains user ID
        chatMessageService.markMessagesAsRead(conversationId, userId);
    }

    // REST endpoints for message history and management
    @GetMapping("/conversations/{conversationId}/messages")
    public List<ChatMessageDTO> getConversationMessages(@PathVariable Long conversationId) {
        return chatMessageService.getMessagesByConversationId(conversationId);
    }

    @PostMapping("/messages")
    public ChatMessageDTO createMessage(@RequestBody ChatMessageDTO chatMessageDto) {
        return chatMessageService.saveMessage(chatMessageDto);
    }

    @GetMapping("/messages/unread/{userId}")
    public List<ChatMessageDTO> getUnreadMessages(@PathVariable Long userId) {
        return chatMessageService.getUnreadMessages(userId);
    }
}
