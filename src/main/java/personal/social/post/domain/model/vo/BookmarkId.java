package personal.social.post.domain.model.vo;

import java.util.UUID;

public record BookmarkId(String value) {
    public static BookmarkId generate() {
        return new BookmarkId(UUID.randomUUID().toString());
    }
}
