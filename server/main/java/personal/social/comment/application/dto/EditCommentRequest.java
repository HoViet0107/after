package personal.social.comment.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditCommentRequest(
        @NotBlank(message = "Content is required")
        @Size(max = 500, message = "Content too long")
        String content
) {}
