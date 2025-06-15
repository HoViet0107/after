package personal.social.post.domain.model.vo;

import java.util.UUID;

public record ShareId(String value) {
    public static ShareId generate() {
        return new ShareId(UUID.randomUUID().toString());
    }
}
