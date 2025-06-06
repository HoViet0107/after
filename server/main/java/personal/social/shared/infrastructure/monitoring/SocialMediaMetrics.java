package personal.social.shared.infrastructure.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
public class SocialMediaMetrics implements MeterBinder {

    private final RedisTemplate<String, Object> redisTemplate;
    private MeterRegistry registry;
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
    private final AtomicLong activeUsersGauge = new AtomicLong(0);
    private final AtomicLong activeConversationsGauge = new AtomicLong(0);

    public SocialMediaMetrics(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void bindTo(MeterRegistry registry) {
        this.registry = registry;
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

        // Gauges - Fixed registration
        Gauge.builder("social.users.active", this, SocialMediaMetrics::getActiveUserCount)
                .description("Currently active users")
                .strongReference(true) // avoid garbage collection
                .register(registry);

        Gauge.builder("social.conversations.active", this, SocialMediaMetrics::getActiveConversationCount)
                .description("Currently active conversations")
                .strongReference(true) // avoid garbage collection
                .register(registry);

        Gauge.builder("social.cache.memory.usage", this, SocialMediaMetrics::getCacheMemoryUsage)
                .description("Cache memory usage")
                .strongReference(true) // avoid garbage collection
                .register(registry);
    }

    // Recording methods
    public void recordMessageSent(String messageType) {
        Counter.builder("social.messages.sent.total")
                .tag("message_type", messageType)
                .register(registry)
                .increment();
    }

    public void recordPostCreated(String postType) {
        Counter.builder("social.posts.created.total")
                .tag("post_type", postType)
                .register(registry)
                .increment();
    }

    public void recordLike(String contentType) {
        Counter.builder("social.likes.total")
                .tag("content_type", contentType)
                .register(registry)
                .increment();
    }

    public void recordComment(String contentType) {
        Counter.builder("social.comments.total")
                .tag("content_type", contentType)
                .register(registry)
                .increment();
    }

    public Timer.Sample startMessageProcessing() {
        return Timer.start();
    }

    public Timer.Sample startFeedGeneration() {
        return Timer.start();
    }

    public Timer.Sample startCacheAccess() {
        return Timer.start();
    }

    // Gauge value providers - Fixed access modifiers
    public double getActiveUserCount() {
        try {
            Long count = redisTemplate.opsForSet().size("online:users");
            return count != null ? count.doubleValue() : 0.0;
        } catch (Exception e) {
            return 0.0;
        }
    }

    public double getActiveConversationCount() {
        try {
            return redisTemplate.keys("conversation:active:*").size();
        } catch (Exception e) {
            return 0.0;
        }
    }

    public double getCacheMemoryUsage() {
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

    public void stopMessageProcessing(Timer.Sample sample) {
        sample.stop(messageProcessingTimer);
    }

    public void stopFeedGeneration(Timer.Sample sample) {
        sample.stop(feedGenerationTimer);
    }

    public void stopCacheAccess(Timer.Sample sample) {
        sample.stop(cacheAccessTimer);
    }
}