package personal.social.feed.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface PostJpaRepository extends JpaRepository<PostEntity, Long> {

    // Optimized feed query với single query
    @Query(value = """
        SELECT p.id, p.content, p.created_at, p.updated_at,
               u.id as author_id, u.username, u.display_name, u.avatar_url,
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
            WHERE status = 'ACTIVE'
            GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as share_count
            FROM post_shares 
            GROUP BY post_id
        ) share_counts ON p.id = share_counts.post_id
        LEFT JOIN post_likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = :currentUserId
        LEFT JOIN post_bookmarks user_bookmarks ON p.id = user_bookmarks.post_id AND user_bookmarks.user_id = :currentUserId
        WHERE p.status = 'ACTIVE'
          AND (:followingOnly = false OR p.author_id IN :followedUserIds)
          AND (:hashtags IS NULL OR EXISTS (
              SELECT 1 FROM post_hashtags ph 
              WHERE ph.post_id = p.id AND ph.hashtag IN :hashtags
          ))
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findOptimizedFeed(
            @Param("currentUserId") Long currentUserId,
            @Param("followingOnly") boolean followingOnly,
            @Param("followedUserIds") Set<Long> followedUserIds,
            @Param("hashtags") Set<String> hashtags,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // EntityGraph để fetch associations efficiently
    @EntityGraph(
            type = EntityGraph.EntityGraphType.FETCH,
            attributePaths = {
                    "author",
                    "author.profile",
                    "media",
                    "hashtags",
                    "topComments",
                    "topComments.author"
            }
    )
    @Query("SELECT p FROM PostEntity p WHERE p.id = :postId")
    PostEntity findByIdWithAssociations(@Param("postId") Long postId);

    // Batch loading cho mobile feed
    @Query("SELECT p FROM PostEntity p JOIN FETCH p.author WHERE p.id IN :postIds ORDER BY p.createdAt DESC")
    List<PostEntity> findByIdsForMobile(@Param("postIds") List<Long> postIds);

    // User's posts với pagination
    @Query("""
        SELECT p FROM PostEntity p 
        WHERE p.author.id = :authorId 
        AND p.status = 'ACTIVE'
        ORDER BY p.createdAt DESC
        """)
    Page<PostEntity> findByAuthorId(@Param("authorId") Long authorId, Pageable pageable);

    // Trending posts (based on engagement)
    @Query(value = """
        SELECT p.*, engagement_score
        FROM posts p
        JOIN (
            SELECT post_id,
                   (COALESCE(like_count, 0) * 1.0 + 
                    COALESCE(comment_count, 0) * 2.0 + 
                    COALESCE(share_count, 0) * 3.0) / 
                   EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as engagement_score
            FROM posts
            WHERE created_at > :since
        ) scores ON p.id = scores.post_id
        ORDER BY engagement_score DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<PostEntity> findTrendingPosts(@Param("since") LocalDateTime since, @Param("limit") int limit);

    // Hashtag-based discovery
    @Query("""
        SELECT DISTINCT p FROM PostEntity p 
        JOIN p.hashtags h 
        WHERE h.value IN :hashtags 
        AND p.createdAt > :since
        AND p.status = 'ACTIVE'
        ORDER BY p.createdAt DESC
        """)
    Page<PostEntity> findByHashtagsAndRecent(
            @Param("hashtags") Set<String> hashtags,
            @Param("since") LocalDateTime since,
            Pageable pageable
    );
}
