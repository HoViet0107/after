package personal.social.feed.application.dto.out;

import personal.social.feed.domain.model.Post;
import java.time.LocalDateTime;

public record CreatePostResponse(
        String id,
        String authorId,
        String content,
        String visibility,
        LocalDateTime createdAt,
        int hashtagCount,
        int taggedUsersCount
) {
    public static CreatePostResponse from(Post post) {
        return new CreatePostResponse(
                post.getId().value(),
                post.getAuthorId().value(),
                post.getContent().text(),
                post.getVisibility().toString(),
                post.getCreatedAt(),
                post.getHashtags().size(),
                post.getTaggedUsers().size()
        );
    }
}
