package personal.social.services.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import personal.social.config.properties.ApplicationProperties;
import personal.social.exceptions.RateLimitExceededException;
import personal.social.services.RedisService;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitingService {

    private final RedisService redisService;
    private final ApplicationProperties applicationProperties;

    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:";

    public void checkRateLimit(String identifier, String action) {
        if (!applicationProperties.getSecurity().isEnableRateLimit()) {
            return;
        }

        String key = RATE_LIMIT_KEY_PREFIX + action + ":" + identifier;
        int maxRequests = applicationProperties.getSecurity().getRateLimitRequests();
        int windowMinutes = applicationProperties.getSecurity().getRateLimitWindowMinutes();

        try {
            Long currentCount = redisService.increment(key);

            if (currentCount == 1) {
                // First request in window, set expiration
                redisService.expire(key, Duration.ofMinutes(windowMinutes));
            }

            if (currentCount > maxRequests) {
                log.warn("Rate limit exceeded for {} on action {}: {} requests",
                        identifier, action, currentCount);
                throw new RateLimitExceededException(
                        String.format("Rate limit exceeded. Max %d requests per %d minutes",
                                maxRequests, windowMinutes));
            }

            log.debug("Rate limit check passed for {} on action {}: {}/{} requests",
                    identifier, action, currentCount, maxRequests);

        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error checking rate limit for {}: {}", identifier, e.getMessage());
            // Fail open - don't block on rate limiting errors
        }
    }

    public void incrementCounter(String identifier, String action) {
        if (!applicationProperties.getSecurity().isEnableRateLimit()) {
            return;
        }

        try {
            String key = RATE_LIMIT_KEY_PREFIX + action + ":" + identifier;
            redisService.increment(key);
        } catch (Exception e) {
            log.error("Error incrementing rate limit counter for {}: {}", identifier, e.getMessage());
        }
    }

    public long getRemainingRequests(String identifier, String action) {
        if (!applicationProperties.getSecurity().isEnableRateLimit()) {
            return Long.MAX_VALUE;
        }

        try {
            String key = RATE_LIMIT_KEY_PREFIX + action + ":" + identifier;
            Long currentCount = redisService.get(key, Long.class);
            int maxRequests = applicationProperties.getSecurity().getRateLimitRequests();

            if (currentCount == null) {
                return maxRequests;
            }

            return Math.max(0, maxRequests - currentCount);
        } catch (Exception e) {
            log.error("Error getting remaining requests for {}: {}", identifier, e.getMessage());
            return Long.MAX_VALUE;
        }
    }
}
