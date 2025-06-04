package personal.social.services.monitoring;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import personal.social.services.RedisService;
import personal.social.repository.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsCollectionService {

    private final RedisService redisService;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    private static final String METRICS_KEY_PREFIX = "metrics:";

    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    public void collectSystemMetrics() {
        try {
            Map<String, Object> metrics = new HashMap<>();

            // Collect user metrics
            metrics.put("total_users", userRepository.count());

            // Collect message metrics
            metrics.put("total_messages", messageRepository.count());

            // Collect conversation metrics
            metrics.put("total_conversations", conversationRepository.count());

            // Collect online user count
            var onlineUsers = redisService.sMembers("cache:online:users");
            metrics.put("online_users", onlineUsers.size());

            // Store metrics with timestamp
            String timestamp = LocalDateTime.now().toString();
            redisService.hSet(METRICS_KEY_PREFIX + timestamp, "data", metrics);
            redisService.expire(METRICS_KEY_PREFIX + timestamp, Duration.ofDays(7));

            // Store latest metrics
            redisService.set(METRICS_KEY_PREFIX + "latest", metrics, Duration.ofMinutes(10));

            log.debug("System metrics collected: {}", metrics);
        } catch (Exception e) {
            log.error("Error collecting system metrics: {}", e.getMessage(), e);
        }
    }

    public Map<String, Object> getLatestMetrics() {
        try {
            return (Map<String, Object>) redisService.get(METRICS_KEY_PREFIX + "latest", Map.class);
        } catch (Exception e) {
            log.error("Error retrieving latest metrics: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    public void incrementMessageCounter() {
        try {
            String key = METRICS_KEY_PREFIX + "messages:today:" + LocalDateTime.now().toLocalDate();
            redisService.increment(key);
            redisService.expire(key, Duration.ofDays(30));
        } catch (Exception e) {
            log.error("Error incrementing message counter: {}", e.getMessage());
        }
    }

    public void incrementLoginCounter() {
        try {
            String key = METRICS_KEY_PREFIX + "logins:today:" + LocalDateTime.now().toLocalDate();
            redisService.increment(key);
            redisService.expire(key, Duration.ofDays(30));
        } catch (Exception e) {
            log.error("Error incrementing login counter: {}", e.getMessage());
        }
    }
}
