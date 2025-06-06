package personal.social.feed.domain.model;

import lombok.Getter;
import personal.social.feed.domain.model.vo.LikeId;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
class PostLike {
    private final LikeId id;
    private final UserId userId;
    private final PostId postId;
    private final LocalDateTime createdAt;

    private PostLike(UserId userId, PostId postId) {
        this.id = LikeId.generate();
        this.userId = Objects.requireNonNull(userId);
        this.postId = Objects.requireNonNull(postId);
        this.createdAt = LocalDateTime.now();
    }

    public static PostLike create(UserId userId, PostId postId) {
        return new PostLike(userId, postId);
    }
}
