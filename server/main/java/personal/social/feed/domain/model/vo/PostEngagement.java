package personal.social.feed.domain.model.vo;

import lombok.Builder;

@Builder
public record PostEngagement(
        int likeCount,
        int commentCount,
        int shareCount,
        int bookmarkCount,
        double engagementRate
) {}
