package personal.social.shared.infrastructure.security;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;

@Component
public class RateLimitingService {

    private final RedisTemplate<String, String> redisTemplate;

    // Lua script for atomic rate limiting
    private final RedisScript<Long> rateLimitScript = RedisScript.of("""
            local key = KEYS[1]
            local window = tonumber(ARGV[1])
            local limit = tonumber(ARGV[2])
            local current_time = tonumber(ARGV[3])
                    
            local current = redis.call('GET', key)
            if current == false then
                redis.call('SETEX', key, window, 1)
                return 1
            end
                    
            current = tonumber(current)
            if current < limit then
                return redis.call('INCR', key)
            else
                return -1
            end
            """, Long.class);

    public RateLimitingService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean isAllowed(String identifier, int limit, Duration window) {
        String key = "rate_limit:" + identifier;
        long currentTime = System.currentTimeMillis() / 1000;

        Long result = redisTemplate.execute(
                rateLimitScript,
                Collections.singletonList(key),
                String.valueOf(window.getSeconds()),
                String.valueOf(limit),
                String.valueOf(currentTime)
        );

        return result != null && result > 0;
    }

    public RateLimitResult checkRateLimit(String identifier, int limit, Duration window) {
        String key = "rate_limit:" + identifier;
        String currentCount = redisTemplate.opsForValue().get(key);

        if (currentCount == null) {
            redisTemplate.opsForValue().set(key, "1", window);
            return new RateLimitResult(true, 1, limit, window.getSeconds());
        }

        int count = Integer.parseInt(currentCount);
        if (count >= limit) {
            Long ttl = redisTemplate.getExpire(key);
            return new RateLimitResult(false, count, limit, ttl != null ? ttl : 0);
        }

        Long newCount = redisTemplate.opsForValue().increment(key);
        Long ttl = redisTemplate.getExpire(key);

        return new RateLimitResult(true, newCount.intValue(), limit, ttl != null ? ttl : 0);
    }
}

