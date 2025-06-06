package personal.social.comment.application.dto;

import lombok.Builder;
import personal.social.comment.domain.model.CommentMedia;

import java.time.LocalDateTime;

@Builder
public record CommentMediaDto(
        String id,
        String url,
        String type,
        String thumbnailUrl,
        String altText,
        Integer width,
        Integer height,
        Long fileSize,
        LocalDateTime createdAt
) {
    public static CommentMediaDto from(CommentMedia media) {
        return CommentMediaDto.builder()
                .id(media.getId().value())
                .url(media.getUrl())
                .type(media.getType().name())
                .thumbnailUrl(media.getThumbnailUrl())
                .altText(media.getAltText())
                .width(media.getWidth())
                .height(media.getHeight())
                .fileSize(media.getFileSize())
                .createdAt(media.getCreatedAt())
                .build();
    }
}

