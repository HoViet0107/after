package personal.social.message.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import personal.social.message.application.dto.PresenceEvent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
@Slf4j
public class PresenceSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final Executor redisListenerExecutor;

    public PresenceSubscriber(
            SimpMessagingTemplate messagingTemplate,
            ObjectMapper objectMapper,
            @Qualifier("redisListenerExecutor") Executor redisListenerExecutor) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
        this.redisListenerExecutor = redisListenerExecutor;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        CompletableFuture.runAsync(() -> processPresenceEvent(message), redisListenerExecutor)
                .exceptionally(throwable -> {
                    log.error("Error processing presence event: {}", throwable.getMessage(), throwable);
                    return null;
                });
    }

    private void processPresenceEvent(Message message) {
        try {
            String messageBody = new String(message.getBody());
            PresenceEvent presenceEvent = objectMapper.readValue(messageBody, PresenceEvent.class);

            // Broadcast to all interested clients
            messagingTemplate.convertAndSend("/topic/presence", presenceEvent);

            // Also send to specific user's followers/friends
            messagingTemplate.convertAndSend(
                    "/topic/user/" + presenceEvent.userId() + "/presence",
                    presenceEvent
            );

            log.debug("Processed presence event for user: {}, online: {}",
                    presenceEvent.userId(), presenceEvent.isOnline());

        } catch (Exception e) {
            log.error("Error processing presence event: {}", e.getMessage(), e);
        }
    }
}