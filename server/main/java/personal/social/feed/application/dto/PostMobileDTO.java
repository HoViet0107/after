package personal.social.feed.application.dto;

import lombok.*;
import personal.social.shared.dto.base.BaseResponseDTO;

import java.time.LocalDateTime;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMobileDTO extends BaseResponseDTO {
    private Long id;
    private String content;
    private String authorUsername;
    private String authorAvatarUrl;
    private LocalDateTime createdAt;
    private int likeCount;
    private int commentCount;
    private boolean isLikedByCurrentUser;
    private boolean isBookmarked;
    private String firstMediaUrl; // Only first media for mobile
    private String mediaType; // IMAGE, VIDEO, NONE
}