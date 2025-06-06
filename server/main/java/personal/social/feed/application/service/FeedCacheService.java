package personal.social.feed.application.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import personal.social.feed.infrastructure.persistence.repository.PostJpaRepository;

import java.time.Duration;
import java.util.Collections;

@Service
public class FeedCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final PostJpaRepository postRepository;

    public FeedCacheService(RedisTemplate<String, Object> redisTemplate,
                            PostJpaRepository postRepository) {
        this.redisTemplate = redisTemplate;
        this.postRepository = postRepository;
    }

    public long getFeedCount(String userId, boolean followingOnly) {
        String cacheKey = "feed:count:" + userId + ":" + followingOnly;

        Long cachedCount = (Long) redisTemplate.opsForValue().get(cacheKey);
        if (cachedCount != null) {
            return cachedCount;
        }

        // Calculate and cache
        long count = followingOnly ?
                postRepository.countByFollowedUsers(Collections.singleton(userId)) :
                postRepository.countAllActive();

        redisTemplate.opsForValue().set(cacheKey, count, Duration.ofMinutes(15));
        return count;
    }

    public void invalidateFeedCache(String userId) {
        String pattern = "feed:*:" + userId + ":*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }
}
