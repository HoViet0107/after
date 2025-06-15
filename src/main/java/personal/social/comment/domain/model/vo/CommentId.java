package personal.social.comment.domain.model.vo;

import java.util.UUID;

public record CommentId(String value) {
    public CommentId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Post ID must be positive");
        }
    }

    public static CommentId of(String value) {
        return new CommentId(value);
    }

    public static CommentId generate() {
        return new CommentId(UUID.randomUUID().toString());
    }
}
