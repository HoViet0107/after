package personal.social.post.application.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaDTO {
    private String id;
    private String url;
    private String thumbnailUrl;
    private String type; // IMAGE, VIDEO, GIF
    private String altText;
    private Integer width;
    private Integer height;
    private Long fileSize;
}
