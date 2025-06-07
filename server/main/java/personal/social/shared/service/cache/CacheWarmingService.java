package personal.social.shared.service.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import personal.social.conversation.domain.repository.ConversationRepository;
import personal.social.post.domain.repository.PostRepository;
import personal.social.user.domain.repository.UserRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class CacheWarmingService {

    private final SocialMediaCacheService cacheService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ConversationRepository conversationRepository;

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
