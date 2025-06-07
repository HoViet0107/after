package personal.social.comment.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import personal.social.post.domain.model.vo.MediaId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.shared.domain.enums.FeedMediaType;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class CommentMedia {
    private final MediaId id;
    private final PostId postId;
    private final String url;
    private final FeedMediaType type;
    private final String thumbnailUrl;
    private final String altText;
    private final Integer width;
    private final Integer height;
    private final Long fileSize;
    private final LocalDateTime createdAt;

    public static CommentMedia create(PostId postId, String url, FeedMediaType type) {
        return CommentMedia.builder()
                .id(MediaId.generate())
                .postId(Objects.requireNonNull(postId, "Post ID cannot be null"))
                .url(Objects.requireNonNull(url, "Media URL cannot be null"))
                .type(Objects.requireNonNull(type, "Media type cannot be null"))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
