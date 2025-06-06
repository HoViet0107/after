package personal.social.feed.application.dto;

import lombok.*;
import personal.social.shared.application.dto.base.BaseResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostWebDTO extends BaseResponseDTO {
    private String id;
    private String content;
    private UserSummaryDTO author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Engagement metrics
    private EngagementDTO engagement;

    // Rich content
    private List<MediaDTO> media;
    private LocationDTO location;
    private List<String> hashtags;
    private List<UserSummaryDTO> taggedUsers;
    private List<CommentPreviewDTO> topComments;

    // User interactions
    private boolean isLikedByCurrentUser;
    private boolean isBookmarked;
    private boolean isFollowingAuthor;
    private String visibility;
}
