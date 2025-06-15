package personal.social.post.application.dto.out;

import personal.social.post.domain.model.Post;

import java.time.LocalDateTime;

public record PostResponse(
        String id,
        String authorId,
        String content,
        String visibility,
        String status,
        LocalDateTime createdAt,
        LocalDateTime editedAt,
        int likeCount,
        int shareCount,
        int bookmarkCount
) {
    public static PostResponse from(Post post) {
        return new PostResponse(
                post.getId().value(),
                post.getAuthorId().value(),
                post.getContent().text(),
                post.getVisibility().toString(),
                post.getPostStatus().toString(),
                post.getCreatedAt(),
                post.getEditedAt(),
                post.getLikes().size(),
                post.getShares().size(),
                post.getBookmarks().size()
        );
    }
}
