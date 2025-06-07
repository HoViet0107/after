package personal.social.post.application.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private boolean isVerified;
    private boolean isFollowing;
}
