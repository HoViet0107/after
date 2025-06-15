package personal.social.post.domain.model.vo;

import java.util.UUID;

public record MediaId(String value) {
    public static MediaId generate() {
        return new MediaId(UUID.randomUUID().toString());
    }
}
