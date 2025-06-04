package personal.social.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import personal.social.services.RedisService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisServiceImpl implements RedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            log.debug("Set value for key: {}", key);
        } catch (Exception e) {
            log.error("Error setting value for key: {}", key, e);
            throw new RuntimeException("Redis set operation failed", e);
        }
    }

    @Override
    public void set(String key, Object value, Duration duration) {
        try {
            redisTemplate.opsForValue().set(key, value, duration.toSeconds(), TimeUnit.SECONDS);
            log.debug("Set value for key: {} with TTL: {}", key, duration);
        } catch (Exception e) {
            log.error("Error setting value with TTL for key: {}", key, e);
            throw new RuntimeException("Redis set with TTL operation failed", e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }

            if (type.isInstance(value)) {
                return (T) value;
            }

            // Convert using ObjectMapper for complex objects
            return objectMapper.convertValue(value, type);
        } catch (Exception e) {
            log.error("Error getting value for key: {}", key, e);
            return null;
        }
    }

    @Override
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Deleted key: {}", key);
        } catch (Exception e) {
            log.error("Error deleting key: {}", key, e);
        }
    }

    @Override
    public void deletePattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Deleted {} keys matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.error("Error deleting keys with pattern: {}", pattern, e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Error checking existence of key: {}", key, e);
            return false;
        }
    }

    @Override
    public void expire(String key, Duration duration) {
        try {
            redisTemplate.expire(key, duration.toSeconds(), TimeUnit.SECONDS);
            log.debug("Set expiration for key: {} to {}", key, duration);
        } catch (Exception e) {
            log.error("Error setting expiration for key: {}", key, e);
        }
    }

    @Override
    public void hSet(String key, String field, Object value) {
        try {
            redisTemplate.opsForHash().put(key, field, value);
            log.debug("Hash set - key: {}, field: {}", key, field);
        } catch (Exception e) {
            log.error("Error in hash set operation for key: {}, field: {}", key, field, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T hGet(String key, String field, Class<T> type) {
        try {
            Object value = redisTemplate.opsForHash().get(key, field);
            if (value == null) {
                return null;
            }

            if (type.isInstance(value)) {
                return (T) value;
            }

            return objectMapper.convertValue(value, type);
        } catch (Exception e) {
            log.error("Error in hash get operation for key: {}, field: {}", key, field, e);
            return null;
        }
    }

    @Override
    public Map<String, Object> hGetAll(String key) {
        try {
            return redisTemplate.opsForHash().entries(key);
        } catch (Exception e) {
            log.error("Error getting all hash entries for key: {}", key, e);
            return Map.of();
        }
    }

    @Override
    public void hDelete(String key, String... fields) {
        try {
            redisTemplate.opsForHash().delete(key, (Object[]) fields);
            log.debug("Hash delete - key: {}, fields: {}", key, String.join(",", fields));
        } catch (Exception e) {
            log.error("Error in hash delete operation for key: {}", key, e);
        }
    }

    @Override
    public void sAdd(String key, Object... values) {
        try {
            redisTemplate.opsForSet().add(key, values);
            log.debug("Set add - key: {}, values count: {}", key, values.length);
        } catch (Exception e) {
            log.error("Error in set add operation for key: {}", key, e);
        }
    }

    @Override
    public Set<Object> sMembers(String key) {
        try {
            return redisTemplate.opsForSet().members(key);
        } catch (Exception e) {
            log.error("Error getting set members for key: {}", key, e);
            return Set.of();
        }
    }

    @Override
    public void sRemove(String key, Object... values) {
        try {
            redisTemplate.opsForSet().remove(key, values);
            log.debug("Set remove - key: {}, values count: {}", key, values.length);
        } catch (Exception e) {
            log.error("Error in set remove operation for key: {}", key, e);
        }
    }

    @Override
    public boolean sIsMember(String key, Object value) {
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, value));
        } catch (Exception e) {
            log.error("Error checking set membership for key: {}", key, e);
            return false;
        }
    }

    @Override
    public void lPush(String key, Object... values) {
        try {
            redisTemplate.opsForList().leftPushAll(key, values);
            log.debug("List left push - key: {}, values count: {}", key, values.length);
        } catch (Exception e) {
            log.error("Error in list left push operation for key: {}", key, e);
        }
    }

    @Override
    public void rPush(String key, Object... values) {
        try {
            redisTemplate.opsForList().rightPushAll(key, values);
            log.debug("List right push - key: {}, values count: {}", key, values.length);
        } catch (Exception e) {
            log.error("Error in list right push operation for key: {}", key, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T lPop(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForList().leftPop(key);
            if (value == null) {
                return null;
            }

            if (type.isInstance(value)) {
                return (T) value;
            }

            return objectMapper.convertValue(value, type);
        } catch (Exception e) {
            log.error("Error in list left pop operation for key: {}", key, e);
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T rPop(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForList().rightPop(key);
            if (value == null) {
                return null;
            }

            if (type.isInstance(value)) {
                return (T) value;
            }

            return objectMapper.convertValue(value, type);
        } catch (Exception e) {
            log.error("Error in list right pop operation for key: {}", key, e);
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> List<T> lRange(String key, long start, long end, Class<T> type) {
        try {
            List<Object> values = redisTemplate.opsForList().range(key, start, end);
            if (values == null) {
                return List.of();
            }

            return values.stream()
                    .map(value -> {
                        if (type.isInstance(value)) {
                            return (T) value;
                        }
                        return objectMapper.convertValue(value, type);
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Error in list range operation for key: {}", key, e);
            return List.of();
        }
    }

    @Override
    public Long increment(String key) {
        try {
            return redisTemplate.opsForValue().increment(key);
        } catch (Exception e) {
            log.error("Error incrementing key: {}", key, e);
            return 0L;
        }
    }

    @Override
    public Long increment(String key, long delta) {
        try {
            return redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Error incrementing key: {} by delta: {}", key, delta, e);
            return 0L;
        }
    }

    @Override
    public Double increment(String key, double delta) {
        try {
            return redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Error incrementing key: {} by delta: {}", key, delta, e);
            return 0.0;
        }
    }
}
