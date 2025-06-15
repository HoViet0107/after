package personal.social.message.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import personal.social.message.application.dto.TypingIndicator;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
@Slf4j
@RequiredArgsConstructor
public class TypingIndicatorSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final Executor redisSubscriptionExecutor;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        // Process asynchronously to avoid blocking Redis
        CompletableFuture.runAsync(() -> processTypingIndicator(message), redisSubscriptionExecutor)
                .exceptionally(throwable -> {
                    log.error("Error processing typing indicator: {}", throwable.getMessage(), throwable);
                    return null;
                });
    }

    private void processTypingIndicator(Message message) {
        try {
            String channel = new String(message.getChannel());
            String messageBody = new String(message.getBody());

            TypingIndicator typingIndicator = objectMapper.readValue(messageBody, TypingIndicator.class);

            // Extract conversation ID from channel name
            String conversationId = channel.replace("chat.typing.", "");

            // Broadcast to conversation participants
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/typing",
                    typingIndicator
            );

            log.debug("Processed typing indicator for conversation: {}, user: {}, typing: {}",
                    conversationId, typingIndicator.userId(), typingIndicator.isTyping());

        } catch (Exception e) {
            log.error("Error processing typing indicator: {}", e.getMessage(), e);
        }
    }
}