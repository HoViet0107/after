package personal.social.feed.application.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private boolean isVerified;
    private boolean isFollowing;
}
