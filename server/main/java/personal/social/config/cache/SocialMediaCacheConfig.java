package personal.social.config.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class SocialMediaCacheConfig {

    @Bean
    public CacheManager socialMediaCacheManager(RedisConnectionFactory factory) {
        // Configure JSON serializer
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.findAndRegisterModules();

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        // Specific cache configurations
        Map<String, RedisCacheConfiguration> configs = new HashMap<>();

        // User sessions - short TTL, frequently accessed
        configs.put("user-sessions", defaultConfig
                .entryTtl(Duration.ofMinutes(30))
                .prefixCacheNameWith("sessions:"));

        // User profiles - medium TTL, less frequent updates
        configs.put("user-profiles", defaultConfig
                .entryTtl(Duration.ofHours(2))
                .prefixCacheNameWith("profiles:"));

        // Conversations - medium TTL for chat history
        configs.put("conversations", defaultConfig
                .entryTtl(Duration.ofHours(2))
                .prefixCacheNameWith("conv:"));

        // User feeds - shorter TTL với background refresh
        configs.put("user-feeds", defaultConfig
                .entryTtl(Duration.ofMinutes(15))
                .prefixCacheNameWith("feeds:"));

        // Post details - longer TTL, content doesn't change often
        configs.put("posts", defaultConfig
                .entryTtl(Duration.ofHours(6))
                .prefixCacheNameWith("posts:"));

        // Engagement data - short TTL, changes frequently
        configs.put("engagement", defaultConfig
                .entryTtl(Duration.ofMinutes(5))
                .prefixCacheNameWith("engagement:"));

        // Search results - medium TTL
        configs.put("search-results", defaultConfig
                .entryTtl(Duration.ofMinutes(30))
                .prefixCacheNameWith("search:"));

        // Notification counts - very short TTL
        configs.put("notification-counts", defaultConfig
                .entryTtl(Duration.ofMinutes(2))
                .prefixCacheNameWith("notif:"));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configs)
                .transactionAware()
                .build();
    }
}
