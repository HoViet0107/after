package personal.social.config.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis configuration class that provides beans for Redis connectivity and operations.
 * This class configures the Redis connection settings, serialization strategies, and 
 * message listener container for pub/sub functionality.
 * 
 * <p>The configuration includes:
 * <ul>
 *   <li>Redis connection to a local server (localhost:6379)</li>
 *   <li>RedisTemplate with String keys and JSON serialized values</li>
 *   <li>Message listener container for chat messages, typing indicators, and user presence</li>
 * </ul>
 * 
 * @see org.springframework.data.redis.connection.RedisConnectionFactory
 * @see org.springframework.data.redis.core.RedisTemplate
 * @see org.springframework.data.redis.listener.RedisMessageListenerContainer
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("localhost");
        config.setPort(6379);
        config.setDatabase(0);
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Use JSON serializer for values
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.setDefaultSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            ChatMessageSubscriber messageSubscriber,
            TypingIndicatorSubscriber typingSubscriber,
            PresenceSubscriber presenceSubscriber) {

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Subscribe to different message channels
        container.addMessageListener(messageSubscriber, new PatternTopic("chat.message.*"));
        container.addMessageListener(typingSubscriber, new PatternTopic("chat.typing.*"));
        container.addMessageListener(presenceSubscriber, new PatternTopic("user.presence.*"));

        return container;
    }
}
