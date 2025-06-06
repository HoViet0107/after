package personal.social.comment.domain.event;

import personal.social.comment.domain.model.vo.CommentId;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record CommentCreatedEvent(
        CommentId commentId,
        PostId postId,
        UserId authorId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public CommentCreatedEvent(CommentId commentId, PostId postId, UserId authorId) {
        this(commentId, postId, authorId, LocalDateTime.now());
    }
}
