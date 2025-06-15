package personal.social.comment.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReplyRequest(
        @NotNull(message = "Post ID is required")
        String postId,

        @NotNull(message = "Author ID is required")
        String authorId,

        @NotBlank(message = "Content is required")
        @Size(max = 500, message = "Content too long")
        String content,

        String parentCommentId,
        String rootCommentId
) {}
