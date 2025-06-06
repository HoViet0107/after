package personal.social.comment.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.social.comment.infrastructure.persistence.PostCommentEntity;

import java.util.List;

public interface JpaCommentEntityRepository extends JpaRepository<PostCommentEntity, String> {

    List<PostCommentEntity> findByPostIdAndStatusOrderByCreatedAtDesc(String postId, String status);

    List<PostCommentEntity> findByParentCommentIdAndStatusOrderByCreatedAtAsc(String parentId, String status);

    List<PostCommentEntity> findByAuthorIdAndStatusOrderByCreatedAtDesc(String authorId, String status);

    long countByParentCommentIdAndStatus(String parentId, String status);

    @Query("SELECT c FROM PostCommentEntity c WHERE c.post.id = :postId AND c.status = :status AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    List<PostCommentEntity> findTopLevelCommentsByPostId(@Param("postId") String postId, @Param("status") String status);
}
