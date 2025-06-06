package personal.social.feed.domain.model;

import lombok.Getter;
import personal.social.feed.domain.model.vo.PostId;

import java.util.Objects;

@Getter
public class PostHashTag {
    private final String value;
    private final PostId postId;

    private PostHashTag(String value, PostId postId) {
        this.value = validateHashtag(value);
        this.postId = Objects.requireNonNull(postId);
    }

    public static PostHashTag create(String value, PostId postId) {
        return new PostHashTag(value, postId);
    }

    private String validateHashtag(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Hashtag cannot be empty");
        }
        String cleaned = value.replaceFirst("^#+", ""); // Remove leading #
        if (!cleaned.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid hashtag format");
        }
        return cleaned.toLowerCase();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PostHashTag that = (PostHashTag) o;
        return Objects.equals(value, that.value) && Objects.equals(postId, that.postId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, postId);
    }
}
