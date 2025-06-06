package personal.social.comment.application.dto;

import lombok.Builder;
import personal.social.comment.domain.model.PostComment;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CommentDto(
        String id,
        String postId,
        String authorId,
        String authorName,
        String authorAvatar,
        String content,
        LocalDateTime createdAt,
        LocalDateTime editedAt,
        String status,
        String parentCommentId,
        String rootCommentId,
        int likeCount,
        int replyCount,
        boolean isLikedByCurrentUser,
        List<CommentMediaDto> media,
        List<String> taggedUserIds
) {
    public static CommentDto from(PostComment comment) {
        return CommentDto.builder()
                .id(comment.getId().value())
                .postId(comment.getPostId().value())
                .authorId(comment.getAuthorId().value())
                .content(comment.getContent().text())
                .createdAt(comment.getCreatedAt())
                .editedAt(comment.getEditedAt())
                .status(comment.getCommentStatus().name())
                .parentCommentId(comment.getParentCommentId() != null ?
                        comment.getParentCommentId().value() : null)
                .rootCommentId(comment.getRootCommentId() != null ?
                        comment.getRootCommentId().value() : null)
                .likeCount(comment.getLikes().size())
                .replyCount(0) // Will be populated by service
                .isLikedByCurrentUser(false) // Will be populated by service
                .media(comment.getMedia().stream()
                        .map(CommentMediaDto::from)
                        .toList())
                .taggedUserIds(comment.getTaggedUsers().stream()
                        .map(UserId::value)
                        .toList())
                .build();
    }
}
