package personal.social.comment.domain.repository;

import personal.social.comment.domain.model.PostComment;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

public interface CommentRepository {
    PostComment save(PostComment comment);
    Optional<PostComment> findById(CommentId commentId);
    List<PostComment> findByPostId(PostId postId);
    List<PostComment> findRepliesByParentId(CommentId parentId);
    List<PostComment> findByAuthorId(UserId authorId);
    void delete(CommentId commentId);
    long countRepliesByCommentId(CommentId commentId);
    boolean existsById(CommentId commentId);
}
