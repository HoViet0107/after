package personal.social.post.domain.event;

import personal.social.post.domain.model.vo.PostId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record PostCreatedEvent(
        PostId postId,
        UserId authorId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public PostCreatedEvent(PostId postId, UserId authorId) {
        this(postId, authorId, LocalDateTime.now());
    }
}
