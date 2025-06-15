package personal.social.post.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import personal.social.post.application.dto.PostMobileDTO;
import personal.social.post.application.dto.PostWebDTO;
import personal.social.post.application.dto.in.CreatePostRequest;
import personal.social.post.application.dto.out.CreatePostResponse;
import personal.social.post.application.mapper.PostMapper;
import personal.social.post.application.usecase.CreatePostUseCase;
import personal.social.post.domain.model.Post;
import personal.social.post.infrastructure.persistence.PostEntity;
import personal.social.post.infrastructure.persistence.repository.PostJpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
@Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
@RequiredArgsConstructor
public class FeedService {

    private final PostJpaRepository postRepository;
    private final PostMapper postMapper;
    private final FeedCacheService cacheService;
    private final CreatePostUseCase createPostUseCase;

    @Cacheable(value = "user-feeds", key = "#userId + '_mobile_' + #pageable.pageNumber")
    public Page<PostMobileDTO> getMobileFeed(String userId, Pageable pageable) {
        // Get followed users for personalization
        Set<String> followedUserIds = getFollowedUserIds(userId);

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
    public Page<PostWebDTO> getWebFeed(String userId, Pageable pageable) {
        Set<String> followedUserIds = getFollowedUserIds(userId);

        List<Object[]> results = postRepository.findOptimizedFeed(
                userId,
                false, // include all posts for web
                followedUserIds,
                null,
                pageable.getPageSize(),
                (int) pageable.getOffset()
        );

        // For web, we need to fetch full post objects for rich data
        List<String> postIds = results.stream()
                .map(row -> (String) row[0])
                .collect(java.util.stream.Collectors.toList());

        List<PostEntity> fullPosts = postRepository.findByIdsWithAllAssociations(postIds);

        List<PostWebDTO> posts = fullPosts.stream()
                .map(post -> postMapper.toWebDTO(toDomainModel(post)))
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

    // New method for creating posts
    @Transactional
    public CreatePostResponse createPost(CreatePostRequest request, String currentUserId) {
        CreatePostRequest authenticatedRequest = new CreatePostRequest(
                currentUserId,
                request.content(),
                request.visibility(),
                request.hashtags(),
                request.taggedUserIds()
        );

        var response = createPostUseCase.execute(authenticatedRequest);

        return new CreatePostResponse(
                response.id(),
                response.authorId(),
                response.content(),
                response.visibility(),
                response.createdAt(),
                0, // hashtag count
                0  // tagged users count
        );
    }

    // Helper methods
    private Set<String> getFollowedUserIds(String userId) {
        // This would typically come from a UserFollowRepository
        // For now, return empty set as placeholder
        return new HashSet<>();
    }

    private PostMobileDTO mapToMobileDTO(Object[] row) {
        PostMobileDTO dto = new PostMobileDTO();
        dto.setId((String) row[0]);
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
        // This would need a proper entity to domain mapper
        // For now, return null as placeholder - implement proper mapping
        return null;
    }
}
