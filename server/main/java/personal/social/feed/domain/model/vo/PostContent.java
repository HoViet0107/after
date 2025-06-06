package personal.social.feed.domain.model.vo;

public record PostContent(String text) {
    public PostContent {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Post content cannot be empty");
        }
        if (text.length() > 2200) {
            throw new IllegalArgumentException("Post content too long");
        }
    }

    public static PostContent of(String text) {
        return new PostContent(text);
    }
}
