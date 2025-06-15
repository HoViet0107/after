package personal.social.auth.infrastructure.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import personal.social.auth.domain.event.SessionInvalidatedEvent;
import personal.social.auth.domain.model.enums.Platform;

//optional - để notify real-time
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionEventPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String SESSION_EVENT_CHANNEL_PREFIX = "session.events.";

    public void publishSessionInvalidated(Long userId, String sessionId, Platform platform, String reason) {
        SessionInvalidatedEvent event = SessionInvalidatedEvent.builder()
                .userId(userId)
                .sessionId(sessionId)
                .platform(platform)
                .reason(reason)
                .timestamp(System.currentTimeMillis())
                .build();

        String channel = SESSION_EVENT_CHANNEL_PREFIX + userId;
        redisTemplate.convertAndSend(channel, event);

        log.info("Published session invalidated event for user {} on platform {}", userId, platform);
    }
}