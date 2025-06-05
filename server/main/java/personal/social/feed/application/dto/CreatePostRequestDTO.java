package personal.social.feed.application.dto;

import lombok.*;
import personal.social.shared.dto.base.BaseResponseDTO;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequestDTO {
    @NotBlank(message = "Content cannot be empty")
    @Size(max = 280, message = "Post content too long")
    private String content;

    @Size(max = 10, message = "Maximum 10 hashtags allowed")
    private List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]+$") String> hashtags;

    @Size(max = 4, message = "Maximum 4 media files allowed")
    private List<String> mediaUrls;

    private String location;
    private List<@NotNull Long> taggedUserIds;
    private String visibility = "PUBLIC"; // PUBLIC, FRIENDS, PRIVATE
}
