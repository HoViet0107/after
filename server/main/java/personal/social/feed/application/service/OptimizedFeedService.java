package personal.social.feed.application.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import personal.social.feed.application.dto.PostMobileDTO;
import personal.social.feed.application.dto.PostWebDTO;
import personal.social.feed.application.mapper.PostMapper;
import personal.social.feed.infrastructure.persistence.PostJpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
public class OptimizedFeedService {

    private final PostJpaRepository postRepository;
    private final PostMapper postMapper;
    private final UserFollowRepository followRepository;
    private final FeedCacheService cacheService;

    public OptimizedFeedService(PostJpaRepository postRepository,
                                PostMapper postMapper,
                                UserFollowRepository followRepository,
                                FeedCacheService cacheService) {
        this.postRepository = postRepository;
        this.postMapper = postMapper;
        this.followRepository = followRepository;
        this.cacheService = cacheService;
    }

    @Cacheable(value = "user-feeds", key = "#userId + '_mobile_' + #pageable.pageNumber")
    public Page<PostMobileDTO> getMobileFeed(Long userId, Pageable pageable) {
        // Get followed users for personalization
        Set<Long> followedUserIds = followRepository.findFollowedUserIds(userId);

        // Use optimized query
        List<Object[]> results = postRepository.findOptimizedFeed(
                userId,
                true, // following only for mobile to reduce data
                followedUserIds,
                null, // no hashtag filter for main feed
                pageable.getPageSize(),
                (int) pageable.getOffset()
        );

        List<PostMobileDTO> posts = results.stream()
                .map(this::mapToMobileDTO)
                .collect(java.util.stream.Collectors.toList());

        // Get total count (cached)
        long total = cacheService.getFeedCount(userId, true);

        return new PageImpl<>(posts, pageable, total);
    }

    @Cacheable(value = "user-feeds", key = "#userId + '_web_' + #pageable.pageNumber")
    public Page<PostWebDTO> getWebFeed(Long userId, Pageable pageable) {
        Set<Long> followedUserIds = followRepository.findFollowedUserIds(userId);

        List<Object[]> results = postRepository.findOptimizedFeed(
                userId,
                false, // include all posts for web
                followedUserIds,
                null,
                pageable.getPageSize(),
                (int) pageable.getOffset()
        );

        // For web, we need to fetch full post objects for rich data
        List<Long> postIds = results.stream()
                .map(row -> ((Number) row[0]).longValue())
                .collect(java.util.stream.Collectors.toList());

        List<PostEntity> fullPosts = postRepository.findByIdsWithAllAssociations(postIds);

        List<PostWebDTO> posts = fullPosts.stream()
                .map(post -> postMapper.toWebDTO(toDomainModel(post), userId))
                .collect(java.util.stream.Collectors.toList());

        long total = cacheService.getFeedCount(userId, false);
        return new PageImpl<>(posts, pageable, total);
    }

    public Page<PostWebDTO> getTrendingPosts(Pageable pageable) {
        List<PostEntity> trendingPosts = postRepository.findTrendingPosts(
                LocalDateTime.now().minusHours(24),
                pageable.getPageSize()
        );

        List<PostWebDTO> posts = trendingPosts.stream()
                .map(post -> postMapper.toWebDTO(toDomainModel(post)))
                .collect(java.util.stream.Collectors.toList());

        return new PageImpl<>(posts, pageable, posts.size());
    }

    public Page<PostMobileDTO> discoverByHashtags(Set<String> hashtags, Pageable pageable) {
        Page<PostEntity> discoveredPosts = postRepository.findByHashtagsAndRecent(
                hashtags,
                LocalDateTime.now().minusDays(7),
                pageable
        );

        List<PostMobileDTO> posts = discoveredPosts.getContent().stream()
                .map(post -> postMapper.toMobileDTO(toDomainModel(post)))
                .collect(java.util.stream.Collectors.toList());

        return new PageImpl<>(posts, pageable, discoveredPosts.getTotalElements());
    }

    // Helper method to map raw query results to DTO
    private PostMobileDTO mapToMobileDTO(Object[] row) {
        PostMobileDTO dto = new PostMobileDTO();
        dto.setId(((Number) row[0]).longValue());
        dto.setContent((String) row[1]);
        dto.setCreatedAt(((java.sql.Timestamp) row[2]).toLocalDateTime());
        dto.setAuthorUsername((String) row[5]);
        dto.setAuthorAvatarUrl((String) row[7]);
        dto.setLikeCount(((Number) row[8]).intValue());
        dto.setCommentCount(((Number) row[9]).intValue());
        dto.setLikedByCurrentUser((Boolean) row[11]);
        dto.setBookmarked((Boolean) row[12]);
        return dto;
    }

    private Post toDomainModel(PostEntity entity) {
        // Convert JPA entity to domain model
        // Implementation would depend on your domain model structure
        return null; // Placeholder
    }
}
