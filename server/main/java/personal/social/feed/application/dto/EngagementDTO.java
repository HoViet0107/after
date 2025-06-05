package personal.social.feed.application.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementDTO {
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private int bookmarkCount;
    private double engagementRate;
}
