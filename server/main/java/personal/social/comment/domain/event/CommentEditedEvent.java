package personal.social.comment.domain.event;

import personal.social.comment.domain.model.vo.CommentId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.shared.domain.DomainEvent;

import java.time.LocalDateTime;

public record CommentEditedEvent(
        CommentId commentId,
        PostId postId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public CommentEditedEvent(CommentId commentId, PostId postId) {
        this(commentId, postId, LocalDateTime.now());
    }
}
