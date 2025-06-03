package personal.social.services;

import org.springframework.stereotype.Service;
import personal.social.dto.message.MessageDTO;
import personal.social.model.Conversations;

import java.util.Set;

@Service
public interface WebSocketService {

    /**
     * Sends a message to all participants in a conversation.
     *
     * @param message     the message to send
     */
    void sendNewMessage(MessageDTO message);

    /**
     * Sends a message to a specific user.
     *
     * @param email      the ID of the user to send the message to
     * @param destination the destination of the message (e.g. a channel name)
     * @param payload     the message payload
     */
    void sendToUser(String email, String destination, Object payload);

    void userJoinedConversation(Long conversationId, String email);

    void notifyConversationEdited (Long conversationId);

    void userLeftConversation(Long conversationId, String email);

    Set<String> getOnlineUsers(Long conversationId);
}
