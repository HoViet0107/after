package personal.social.feed.application.dto;

import lombok.*;

import java.time.LocalDateTime;
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentPreviewDTO {
    private Long id;
    private String content;
    private String authorUsername;
    private LocalDateTime createdAt;
    private int likeCount;

}
