package personal.social.feed.domain.model.vo;

import java.util.UUID;

public record PostId(String value) {
    public PostId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Post ID must be positive");
        }
    }

    public static PostId of(String value) {
        return new PostId(value);
    }

    public static PostId generate() {
        return new PostId(UUID.randomUUID().toString()); // Simplified ID generation
    }
}
