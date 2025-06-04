package personal.social.services;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface RedisService {
    // Basic operations
    void set(String key, Object value);
    void set(String key, Object value, Duration duration);
    <T> T get(String key, Class<T> type);
    void delete(String key);
    void deletePattern(String pattern);
    boolean exists(String key);
    void expire(String key, Duration duration);

    // Hash operations
    void hSet(String key, String field, Object value);
    <T> T hGet(String key, String field, Class<T> type);
    Map<String, Object> hGetAll(String key);
    void hDelete(String key, String... fields);

    // Set operations
    void sAdd(String key, Object... values);
    Set<Object> sMembers(String key);
    void sRemove(String key, Object... values);
    boolean sIsMember(String key, Object value);

    // List operations
    void lPush(String key, Object... values);
    void rPush(String key, Object... values);
    <T> T lPop(String key, Class<T> type);
    <T> T rPop(String key, Class<T> type);
    <T> List<T> lRange(String key, long start, long end, Class<T> type);

    // Increment operations
    Long increment(String key);
    Long increment(String key, long delta);
    Double increment(String key, double delta);
}
