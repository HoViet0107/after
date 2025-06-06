package personal.social.shared.infrastructure.monitoring;

import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class SocialMediaMetrics implements MeterBinder {

    private final RedisTemplate<String, Object> redisTemplate;

    // Counters
    private Counter messagesSentCounter;
    private Counter postsCreatedCounter;
    private Counter likesCounter;
    private Counter commentsCounter;

    // Timers
    private Timer messageProcessingTimer;
    private Timer feedGenerationTimer;
    private Timer cacheAccessTimer;

    // Gauges
    private AtomicLong activeUsersGauge = new AtomicLong(0);
    private AtomicLong activeConversationsGauge = new AtomicLong(0);

    public SocialMediaMetrics(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void bindTo(MeterRegistry registry) {
        // Counters
        messagesSentCounter = Counter.builder("social.messages.sent.total")
                .description("Total messages sent")
                .tag("type", "chat")
                .register(registry);

        postsCreatedCounter = Counter.builder("social.posts.created.total")
                .description("Total posts created")
                .register(registry);

        likesCounter = Counter.builder("social.likes.total")
                .description("Total likes given")
                .register(registry);

        commentsCounter = Counter.builder("social.comments.total")
                .description("Total comments made")
                .register(registry);

        // Timers
        messageProcessingTimer = Timer.builder("social.message.processing.time")
                .description("Time to process messages")
                .register(registry);

        feedGenerationTimer = Timer.builder("social.feed.generation.time")
                .description("Time to generate user feeds")
                .register(registry);

        cacheAccessTimer = Timer.builder("social.cache.access.time")
                .description("Time to access cache")
                .register(registry);

        // Gauges
        Gauge.builder("social.users.active")
                .description("Currently active users")
                .register(registry, this, SocialMediaMetrics::getActiveUserCount);

        Gauge.builder("social.conversations.active")
                .description("Currently active conversations")
                .register(registry, this, SocialMediaMetrics::getActiveConversationCount);

        Gauge.builder("social.cache.memory.usage")
                .description("Cache memory usage")
                .register(registry, this, SocialMediaMetrics::getCacheMemoryUsage);
    }

    // Recording methods
    public void recordMessageSent(String messageType) {
        messagesSentCounter.increment(Tags.of("message_type", messageType));
    }

    public void recordPostCreated(String postType) {
        postsCreatedCounter.increment(Tags.of("post_type", postType));
    }

    public void recordLike(String contentType) {
        likesCounter.increment(Tags.of("content_type", contentType));
    }

    public void recordComment(String contentType) {
        commentsCounter.increment(Tags.of("content_type", contentType));
    }

    public Timer.Sample startMessageProcessing() {
        return Timer.start(messageProcessingTimer);
    }

    public Timer.Sample startFeedGeneration() {
        return Timer.start(feedGenerationTimer);
    }

    public Timer.Sample startCacheAccess() {
        return Timer.start(cacheAccessTimer);
    }

    // Gauge value providers
    private double getActiveUserCount() {
        try {
            Long count = redisTemplate.opsForSet().size("online:users");
            return count != null ? count.doubleValue() : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double getActiveConversationCount() {
        try {
            return redisTemplate.keys("conversation:active:*").size();
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double getCacheMemoryUsage() {
        try {
            // This would need Redis INFO command implementation
            return 0.0; // Placeholder
        } catch (Exception e) {
            return 0.0;
        }
    }

    public void updateActiveUsers(long count) {
        activeUsersGauge.set(count);
    }

    public void updateActiveConversations(long count) {
        activeConversationsGauge.set(count);
    }
}
