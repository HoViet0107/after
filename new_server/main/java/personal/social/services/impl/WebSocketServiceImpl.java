package personal.social.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import personal.social.repository.ConversationRepository;
import personal.social.repository.MessageRepository;
import personal.social.repository.UserRepository;
import personal.social.services.WebSocketService;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
@Slf4j
public class WebSocketServiceImpl implements WebSocketService {
    private final SimpMessageSendingOperations messagingTemplate;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    // Track online users in conversations
    private final Map<String, Set<String>> conversationUsers = new ConcurrentHashMap<>();

    public void sendNewMessage(MessageDTO message) {
        try {
            messagingTemplate.convertAndSend("/topic/conversation/" + message.getConversationId() + "/messages", message);
            log.debug("Sent message to conversation {}: {}", message.getConversationId(), message.getContent());
        } catch (Exception e) {
            log.error("Error sending message to WebSocket: {}", e.getMessage(), e);
        }
    }

    /**
     * Send a message to a specific user
     */
    @Override
    public void sendToUser(String email, String destination, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(
                    email,
                    destination,
                    payload
            );
            log.debug("Sent notification to user {}: {}", email, destination);
        } catch (Exception e) {
            log.error("Error sending notification to user {}: {}", email, e.getMessage(), e);
        }
    }

    /**
     * Thông báo cập nhật cuộc hội thoại
     */
    @Override
    public void notifyConversationEdited(Long conversationId) {
        try {
            WebSocketEventDto event = WebSocketEventDto.builder()
                    .type("CONVERSATION_UPDATED")
                    .conversationId(conversationId)
                    .timestamp(System.currentTimeMillis())
                    .build();

            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/events", event);
        } catch (Exception e) {
            log.error("Error notifying conversation update: {}", e.getMessage(), e);
        }
    }

    @Override
    public void userJoinedConversation(Long conversationId, String email) {
        Set<String> users = conversationUsers.computeIfAbsent(String.valueOf(conversationId), k -> ConcurrentHashMap.newKeySet());
        users.add(email);

        // Thông báo cho các thành viên khác
        WebSocketEventDto event = WebSocketEventDto.builder()
                .type("USER_JOINED")
                .conversationId(conversationId)
                .email(email)
                .timestamp(System.currentTimeMillis())
                .build();

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/presence", event);
    }

    @Override
    public void userLeftConversation(Long conversationId, String email) {
        Set<String> users = conversationUsers.get(conversationId);
        if (users != null) {
            users.remove(email);

            // Thông báo cho các thành viên khác
            WebSocketEventDto event = WebSocketEventDto.builder()
                    .type("USER_LEFT")
                    .conversationId(conversationId)
                    .email(email)
                    .timestamp(System.currentTimeMillis())
                    .build();

            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/presence", event);
        }
    }

    /**
     * Lấy danh sách người dùng online trong cuộc trò chuyện
     */
    @Override
    public Set<String> getOnlineUsers(Long conversationId) {
        return conversationUsers.getOrDefault(conversationId, ConcurrentHashMap.newKeySet());
    }
}
