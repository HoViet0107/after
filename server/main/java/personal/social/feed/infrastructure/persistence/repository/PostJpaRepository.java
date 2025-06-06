package personal.social.feed.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import personal.social.feed.infrastructure.persistence.PostEntity;
import personal.social.shared.domain.enums.FeedStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface PostJpaRepository extends JpaRepository<PostEntity, String> {

    // Basic queries
    List<PostEntity> findByAuthor_Id(String authorId);

    List<PostEntity> findByStatusAndVisibility(String status, PostEntity.PostVisibility visibility);

    // Optimized feed query
    @Query(value = """
            SELECT p.id, p.content, p.created_at, p.updated_at,
                   u.id as author_id, u.first_name, u.last_name, u.avatar_url,
                   COALESCE(like_counts.like_count, 0) as like_count,
                   COALESCE(comment_counts.comment_count, 0) as comment_count,
                   COALESCE(share_counts.share_count, 0) as share_count,
                   CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as is_liked,
                   CASE WHEN user_bookmarks.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM post_likes 
                GROUP BY post_id
            ) like_counts ON p.id = like_counts.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as comment_count
                FROM comments 
                WHERE comment_status = 'ACTIVE'
                GROUP BY post_id
            ) comment_counts ON p.id = comment_counts.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as share_count
                FROM post_shares 
                GROUP BY post_id
            ) share_counts ON p.id = share_counts.post_id
            LEFT JOIN post_likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = :currentUserId
            LEFT JOIN post_bookmarks user_bookmarks ON p.id = user_bookmarks.post_id AND user_bookmarks.user_id = :currentUserId
            WHERE p.f_status = 'ACTIVE'
              AND (:followingOnly = false OR p.author_id IN :followedUserIds)
              AND (:hashtags IS NULL OR EXISTS (
                  SELECT 1 FROM post_hashtags ph 
                  WHERE ph.post_id = p.id AND ph.hashtag IN :hashtags
              ))
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Object[]> findOptimizedFeed(
            @Param("currentUserId") String currentUserId,
            @Param("followingOnly") boolean followingOnly,
            @Param("followedUserIds") Set<String> followedUserIds,
            @Param("hashtags") Set<String> hashtags,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // EntityGraph associations
    @EntityGraph(
            type = EntityGraph.EntityGraphType.FETCH,
            attributePaths = {
                    "author",
                    "media",
                    "hashtags",
                    "comments",
                    "comments.author"
            }
    )
    @Query("SELECT p FROM PostEntity p WHERE p.id = :postId")
    PostEntity findByIdWithAssociations(@Param("postId") String postId);

    // Batch loading
    @Query("SELECT p FROM PostEntity p JOIN FETCH p.author WHERE p.id IN :postIds ORDER BY p.createdAt DESC")
    List<PostEntity> findByIdsForMobile(@Param("postIds") List<String> postIds);

    // Trending posts
    @Query(value = """
            SELECT p.id
            FROM posts p
            LEFT JOIN (
                SELECT post_id, COUNT(*) as engagement_score
                FROM (
                    SELECT post_id FROM post_likes WHERE created_at > DATE_SUB(NOW(), INTERVAL :hours HOUR)
                    UNION ALL
                    SELECT post_id FROM comments WHERE created_at > DATE_SUB(NOW(), INTERVAL :hours HOUR)
                    UNION ALL
                    SELECT post_id FROM post_shares WHERE created_at > DATE_SUB(NOW(), INTERVAL :hours HOUR)
                ) engagements
                GROUP BY post_id
            ) trending ON p.id = trending.post_id
            WHERE p.created_at > DATE_SUB(NOW(), INTERVAL :hours HOUR)
            AND p.f_status = 'ACTIVE'
            ORDER BY COALESCE(trending.engagement_score, 0) DESC, p.created_at DESC
            LIMIT 50
            """, nativeQuery = true)
    List<String> findTrendingPostIds(@Param("hours") int hours);

    // Hashtag discovery
    @Query("""
            SELECT DISTINCT p FROM PostEntity p 
            JOIN p.hashtags h 
            WHERE h.hashtag IN :hashtags 
            AND p.createdAt > :since
            AND p.status = 'ACTIVE'
            ORDER BY p.createdAt DESC
            """)
    Page<PostEntity> findByHashtagsAndRecent(
            @Param("hashtags") Set<String> hashtags,
            @Param("since") LocalDateTime since,
            Pageable pageable
    );

    // Count methods for cache
    @Query("SELECT COUNT(p) FROM PostEntity p WHERE p.author.id IN :followedUserIds AND p.status = 'ACTIVE'")
    long countByFollowedUsers(@Param("followedUserIds") Set<String> followedUserIds);

    @Query("SELECT COUNT(p) FROM PostEntity p WHERE p.status = 'ACTIVE'")
    long countAllActive();

    // Batch fetch with associations
    @Query("""
            SELECT p FROM PostEntity p 
            LEFT JOIN FETCH p.author 
            LEFT JOIN FETCH p.media 
            LEFT JOIN FETCH p.hashtags 
            LEFT JOIN FETCH p.comments c 
            LEFT JOIN FETCH c.author 
            WHERE p.id IN :postIds 
            ORDER BY p.createdAt DESC
            """)
    List<PostEntity> findByIdsWithAllAssociations(@Param("postIds") List<String> postIds);

    List<PostEntity> findTrendingPosts(LocalDateTime localDateTime, int pageSize);
}