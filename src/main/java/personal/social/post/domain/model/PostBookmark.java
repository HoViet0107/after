package personal.social.post.domain.model;

import lombok.Getter;
import personal.social.post.domain.model.vo.BookmarkId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
public class PostBookmark {
    private final BookmarkId id;
    private final UserId userId;
    private final PostId postId;
    private final LocalDateTime createdAt;

    private PostBookmark(UserId userId, PostId postId) {
        this.id = BookmarkId.generate();
        this.userId = Objects.requireNonNull(userId);
        this.postId = Objects.requireNonNull(postId);
        this.createdAt = LocalDateTime.now();
    }

    public static PostBookmark create(UserId userId, PostId postId) {
        return new PostBookmark(userId, postId);
    }
}
