package personal.social.auth.infrastructure.websocket;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import personal.social.auth.domain.event.SessionInvalidatedEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionNotificationHandler {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifySessionInvalidated(SessionInvalidatedEvent event) {
        String destination = "/user/" + event.getUserId() + "/queue/session";

        SessionNotification notification = SessionNotification.builder()
                .type("SESSION_INVALIDATED")
                .message("Your session has been terminated because you logged in from another device")
                .platform(event.getPlatform().getValue())
                .timestamp(event.getTimestamp())
                .build();

        messagingTemplate.convertAndSend(destination, notification);
        log.info("Sent session invalidation notification to user {}", event.getUserId());
    }

    @Data
    @Builder
    static class SessionNotification {
        private String type;
        private String message;
        private String platform;
        private Long timestamp;
    }
}