package personal.social.comment.application.dto;

import jakarta.validation.constraints.NotNull;

public record CommentLikeRequest(
        @NotNull(message = "Comment ID is required")
        String commentId,

        @NotNull(message = "User ID is required")
        String userId
) {}
