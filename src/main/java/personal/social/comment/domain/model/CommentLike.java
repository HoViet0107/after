package personal.social.comment.domain.model;

import lombok.Getter;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.comment.domain.model.vo.LikeId;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
public class CommentLike {
    private final LikeId id;
    private final UserId userId;
    private final CommentId commentId;
    private final LocalDateTime createdAt;

    private CommentLike(UserId userId, CommentId commentId) {
        this.id = LikeId.generate();
        this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
        this.commentId = Objects.requireNonNull(commentId, "Comment ID cannot be null");
        this.createdAt = LocalDateTime.now();
    }

    public static CommentLike create(UserId userId, CommentId commentId) {
        return new CommentLike(userId, commentId);
    }
}
