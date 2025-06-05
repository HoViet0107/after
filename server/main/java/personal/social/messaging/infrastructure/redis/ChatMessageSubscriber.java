package personal.social.messaging.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public ChatMessageSubscriber(SimpMessagingTemplate messagingTemplate,
                                 ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String messageBody = new String(message.getBody());

            MessageEvent messageEvent = objectMapper.readValue(messageBody, MessageEvent.class);

            // Extract conversation ID from channel name
            String conversationId = channel.replace("chat.message.", "");

            // Broadcast to local WebSocket clients
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId,
                    messageEvent
            );

        } catch (Exception e) {
            // Log error but don't fail
            System.err.println("Error processing chat message: " + e.getMessage());
        }
    }
}
