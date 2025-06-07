package personal.social.post.domain.event;

import personal.social.post.domain.model.vo.PostId;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;

public record PostLikedEvent(
        PostId postId,
        UserId userId,
        LocalDateTime occurredOn
) implements DomainEvent {

    public PostLikedEvent(PostId postId, UserId userId) {
        this(postId, userId, LocalDateTime.now());
    }
}
