package personal.social.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import personal.social.repository.MessageReadStatusRepository;
import personal.social.repository.UserRepository;
import personal.social.services.CachingService;
import personal.social.services.RedisWebSocketSessionManager;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledMaintenanceTasks {

    private final CachingService cachingService;
    private final RedisWebSocketSessionManager sessionManager;
    private final MessageReadStatusRepository readStatusRepository;
    private final UserRepository userRepository;

    /**
     * Clean up expired WebSocket sessions every 5 minutes
     */
    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    public void cleanupExpiredSessions() {
        try {
            log.debug("Starting WebSocket session cleanup task");
            sessionManager.cleanupExpiredSessions();
            log.debug("WebSocket session cleanup task completed");
        } catch (Exception e) {
            log.error("Error during WebSocket session cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Update user last active timestamps every 2 minutes
     */
    @Scheduled(fixedRate = 2, timeUnit = TimeUnit.MINUTES)
    public void updateUserActivityStatus() {
        try {
            log.debug("Starting user activity status update task");

            // Get online users from cache
            var onlineUsers = cachingService.getCachedOnlineUsers();

            // Update last active time for online users
            onlineUsers.forEach(userEmail -> {
                try {
                    var user = userRepository.findByEmail(userEmail);
                    if (user != null) {
                        user.setLastActive(LocalDateTime.now());
                        user.setOnline(true);
                        userRepository.save(user);

                        // Update cache
                        cachingService.cacheUser(user);
                    }
                } catch (Exception e) {
                    log.warn("Error updating activity for user {}: {}", userEmail, e.getMessage());
                }
            });

            log.debug("User activity status update task completed for {} users", onlineUsers.size());
        } catch (Exception e) {
            log.error("Error during user activity status update: {}", e.getMessage(), e);
        }
    }

    /**
     * Clean up old cache entries every hour
     */
    @Scheduled(fixedRate = 1, timeUnit = TimeUnit.HOURS)
    public void cleanupExpiredCache() {
        try {
            log.debug("Starting cache cleanup task");

            // Clean up old message caches (older than 2 hours)
            cachingService.evictPattern("cache:conversation:messages:*");

            // Clean up old user conversations cache
            cachingService.evictPattern("cache:user:conversations:*");

            log.debug("Cache cleanup task completed");
        } catch (Exception e) {
            log.error("Error during cache cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Batch process unread message status updates every 30 seconds
     */
    @Scheduled(fixedRate = 30, timeUnit = TimeUnit.SECONDS)
    public void batchProcessReadStatus() {
        try {
            log.debug("Starting batch read status processing task");

            // This would be implemented based on your specific requirements
            // For example, you might have a queue of read status updates to process

            log.debug("Batch read status processing task completed");
        } catch (Exception e) {
            log.error("Error during batch read status processing: {}", e.getMessage(), e);
        }
    }

    /**
     * Generate and cache statistics every 10 minutes
     */
    @Scheduled(fixedRate = 10, timeUnit = TimeUnit.MINUTES)
    public void generateStatistics() {
        try {
            log.debug("Starting statistics generation task");

            // Generate online user count
            var onlineUsers = cachingService.getCachedOnlineUsers();
            cachingService.cache("stats:online_users_count", onlineUsers.size(),
                    java.time.Duration.ofMinutes(15));

            // Generate total user count
            long totalUsers = userRepository.count();
            cachingService.cache("stats:total_users_count", totalUsers,
                    java.time.Duration.ofHours(1));

            log.debug("Statistics generation task completed - Online: {}, Total: {}",
                    onlineUsers.size(), totalUsers);
        } catch (Exception e) {
            log.error("Error during statistics generation: {}", e.getMessage(), e);
        }
    }

    /**
     * Health check for Redis connectivity every minute
     */
    @Scheduled(fixedRate = 1, timeUnit = TimeUnit.MINUTES)
    public void redisHealthCheck() {
        try {
            // Simple health check - try to set and get a value
            String healthKey = "health:redis:check";
            String healthValue = "ok:" + System.currentTimeMillis();

            cachingService.cache(healthKey, healthValue, java.time.Duration.ofMinutes(2));
            var retrievedValue = cachingService.getFromCache(healthKey, String.class);

            if (retrievedValue.isEmpty() || !retrievedValue.get().equals(healthValue)) {
                log.warn("Redis health check failed - value mismatch");
            } else {
                log.debug("Redis health check passed");
            }
        } catch (Exception e) {
            log.error("Redis health check failed: {}", e.getMessage(), e);
        }
    }
}
