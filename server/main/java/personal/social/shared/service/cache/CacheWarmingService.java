package personal.social.shared.service.cache;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class CacheWarmingService {

    private final SocialMediaCacheService cacheService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public CacheWarmingService(SocialMediaCacheService cacheService,
                               UserRepository userRepository,
                               PostRepository postRepository) {
        this.cacheService = cacheService;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void warmFrequentlyAccessedData() {
        // Warm active user sessions
        CompletableFuture.runAsync(this::warmActiveUserSessions);

        // Warm trending posts
        CompletableFuture.runAsync(this::warmTrendingPosts);

        // Warm popular conversations
        CompletableFuture.runAsync(this::warmPopularConversations);
    }

    private void warmActiveUserSessions() {
        List<String> activeUserIds = userRepository.findActiveUserIds();
        activeUserIds.parallelStream()
                .forEach(userId -> {
                    try {
                        cacheService.getUserSession(userId);
                    } catch (Exception e) {
                        // Log error but continue
                    }
                });
    }

    private void warmTrendingPosts() {
        List<String> trendingPostIds = postRepository.findTrendingPostIds(24); // Last 24 hours
        cacheService.cacheTrendingPosts(trendingPostIds, java.time.Duration.ofHours(1));
    }

    private void warmPopularConversations() {
        List<String> popularConversationIds = conversationRepository.findPopularConversationIds();
        popularConversationIds.parallelStream()
                .forEach(conversationId -> {
                    try {
                        cacheService.getConversationHistory(conversationId, 20);
                    } catch (Exception e) {
                        // Log error but continue
                    }
                });
    }
}
