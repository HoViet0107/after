package personal.social.post.domain.model;

import lombok.Getter;
import personal.social.post.domain.model.vo.PostId;
import personal.social.post.domain.model.vo.ShareId;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
class PostShare {
    private final ShareId id;
    private final UserId userId;
    private final PostId postId;
    private final LocalDateTime createdAt;

    private PostShare(UserId userId, PostId postId) {
        this.id = ShareId.generate();
        this.userId = Objects.requireNonNull(userId);
        this.postId = Objects.requireNonNull(postId);
        this.createdAt = LocalDateTime.now();
    }

    public static PostShare create(UserId userId, PostId postId) {
        return new PostShare(userId, postId);
    }
}
