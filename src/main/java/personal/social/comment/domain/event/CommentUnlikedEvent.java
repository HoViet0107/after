package personal.social.comment.domain.event;

import personal.social.comment.domain.model.vo.CommentId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record CommentUnlikedEvent(
        CommentId commentId,
        UserId userId,
        PostId postId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public CommentUnlikedEvent(CommentId commentId, UserId userId, PostId postId) {
        this(commentId, userId, postId, LocalDateTime.now());
    }
}
