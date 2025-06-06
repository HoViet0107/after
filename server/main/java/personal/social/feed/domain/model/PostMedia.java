package personal.social.feed.domain.model;

import lombok.*;
import personal.social.shared.domain.enums.FeedMediaType;
import personal.social.feed.domain.model.vo.MediaId;
import personal.social.feed.domain.model.vo.PostId;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class PostMedia {
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

    public static PostMedia create(PostId postId, String url, FeedMediaType type) {
        return PostMedia.builder()
                .id(MediaId.generate())
                .postId(Objects.requireNonNull(postId))
                .url(Objects.requireNonNull(url))
                .type(Objects.requireNonNull(type))
                .thumbnailUrl(null) // Optional, can be set later
                .altText(null) // Optional, can be set later
                .width(null) // Optional, can be set later
                .height(null) // Optional, can be set later
                .fileSize(null) // Optional, can be set later
                .createdAt(LocalDateTime.now())
                .build();
    }
}
