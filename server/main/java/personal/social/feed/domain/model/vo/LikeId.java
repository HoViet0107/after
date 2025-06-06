package personal.social.feed.domain.model.vo;

import java.util.UUID;

public record LikeId(String value) {
    public static LikeId generate() {
        return new LikeId(UUID.randomUUID().toString());
    }
}