package personal.social.comment.domain.model.vo;

import lombok.Builder;

@Builder
public record CommentEngagement(
        int likeCount,
        int replyCount,
        double engagementRate
) {
    public static CommentEngagement empty() {
        return new CommentEngagement(0, 0, 0.0);
    }
}