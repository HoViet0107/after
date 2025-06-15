package personal.social.message.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import personal.social.message.application.dto.MessageEvent;

import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
@RequiredArgsConstructor
public class ChatMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        // Process message asynchronously to avoid blocking Redis listener
        CompletableFuture.runAsync(() -> processMessage(message))
                .exceptionally(throwable -> {
                    log.error("Error processing chat message: {}", throwable.getMessage(), throwable);
                    return null;
                });
    }

    private void processMessage(Message message) {
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

            log.debug("Processed message for conversation: {}", conversationId);

        } catch (Exception e) {
            log.error("Error processing chat message: {}", e.getMessage(), e);
        }
    }
}