package personal.social.comment.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.social.comment.infrastructure.persistence.PostCommentEntity;

import java.util.List;

public interface JpaCommentEntityRepository extends JpaRepository<PostCommentEntity, String> {

    @Query("SELECT c FROM PostCommentEntity c WHERE c.post.id = :postId AND c.commentStatus = :status ORDER BY c.createdAt DESC")
    List<PostCommentEntity> findByPostIdAndCommentStatusOrderByCreatedAtDesc(
            @Param("postId") String postId,
            @Param("status") String status);

    @Query("SELECT c FROM PostCommentEntity c WHERE c.post.id = :postId AND c.commentStatus = :status ORDER BY c.createdAt ASC")
    List<PostCommentEntity> findByParentCommentIdAndCommentStatusOrderByCreatedAtAsc(String parentId, String status);

    @Query("SELECT c FROM PostCommentEntity c WHERE c.author.id = :authorId AND c.commentStatus = :status ORDER BY c.createdAt DESC")
    List<PostCommentEntity> findByAuthorIdAndCommentStatusOrderByCreatedAtDesc(String authorId, String status);

    @Query("SELECT COUNT(c.id) FROM PostCommentEntity c WHERE c.parentComment.id = :parentId AND c.commentStatus = :status")
    long countByParentCommentIdAndCommentStatus(String parentId, String status);

    @Query("SELECT c FROM PostCommentEntity c WHERE c.post.id = :postId AND c.commentStatus = :status AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    List<PostCommentEntity> findTopLevelCommentsByPostId(@Param("postId") String postId, @Param("status") String status);
}
