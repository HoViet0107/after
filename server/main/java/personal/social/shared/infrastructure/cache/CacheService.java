package personal.social.shared.infrastructure.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Lua script for atomic operations
    private final RedisScript<Long> incrementWithExpireScript = RedisScript.of(
            "local current = redis.call('incr', KEYS[1]) " +
                    "if current == 1 then " +
                    "  redis.call('expire', KEYS[1], ARGV[1]) " +
                    "end " +
                    "return current", Long.class);

    // ===== Basic Cache Operations =====

    public void set(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
            log.debug("Cached key: {} with TTL: {}", key, ttl);
        } catch (Exception e) {
            log.error("Error caching key {}: {}", key, e.getMessage());
        }
    }

    public <T> T get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) return null;

            if (type.isInstance(value)) {
                return type.cast(value);
            }

            // Try to convert using ObjectMapper
            return objectMapper.convertValue(value, type);
        } catch (Exception e) {
            log.error("Error getting key {}: {}", key, e.getMessage());
            return null;
        }
    }

    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Deleted key: {}", key);
        } catch (Exception e) {
            log.error("Error deleting key {}: {}", key, e.getMessage());
        }
    }

    public void deletePattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (!keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Deleted {} keys matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.error("Error deleting pattern {}: {}", pattern, e.getMessage());
        }
    }

    // ===== Advanced Operations =====

    public Long incrementWithExpire(String key, Duration expire) {
        try {
            return redisTemplate.execute(
                    incrementWithExpireScript,
                    List.of(key),
                    String.valueOf(expire.getSeconds())
            );
        } catch (Exception e) {
            log.error("Error incrementing key {}: {}", key, e.getMessage());
            return null;
        }
    }

    public void addToSet(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForSet().add(key, value);
            redisTemplate.expire(key, ttl);
        } catch (Exception e) {
            log.error("Error adding to set {}: {}", key, e.getMessage());
        }
    }

    public Set<Object> getSet(String key) {
        try {
            return redisTemplate.opsForSet().members(key);
        } catch (Exception e) {
            log.error("Error getting set {}: {}", key, e.getMessage());
            return Set.of();
        }
    }

    public void addToList(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForList().leftPush(key, value);
            redisTemplate.expire(key, ttl);
        } catch (Exception e) {
            log.error("Error adding to list {}: {}", key, e.getMessage());
        }
    }

    public List<Object> getList(String key, long start, long end) {
        try {
            return redisTemplate.opsForList().range(key, start, end);
        } catch (Exception e) {
            log.error("Error getting list {}: {}", key, e.getMessage());
            return List.of();
        }
    }

    // ===== Pub/Sub Operations =====

    public void publish(String channel, Object message) {
        try {
            redisTemplate.convertAndSend(channel, message);
            log.debug("Published message to channel: {}", channel);
        } catch (Exception e) {
            log.error("Error publishing to channel {}: {}", channel, e.getMessage());
        }
    }

    // ===== Cache Statistics =====

    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Error checking key existence {}: {}", key, e.getMessage());
            return false;
        }
    }

    public Long getExpire(String key) {
        try {
            return redisTemplate.getExpire(key, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error getting expiration for key {}: {}", key, e.getMessage());
            return -1L;
        }
    }
}
