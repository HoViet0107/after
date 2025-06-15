package personal.social.post.application.dto.in;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreatePostRequest(
        @NotBlank(message = "Author ID is required")
        String authorId,

        @NotBlank(message = "Content is required")
        @Size(max = 2200, message = "Content too long")
        String content,

        String visibility,
        Set<String> hashtags,
        Set<String> taggedUserIds
) {}
