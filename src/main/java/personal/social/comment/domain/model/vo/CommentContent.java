package personal.social.comment.domain.model.vo;

public record CommentContent(String text) {
    private static final int MAX_LENGTH = 5000;

    public CommentContent {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }
        if (text.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Comment too long");
        }
    }

    public static CommentContent of(String text) {
        return new CommentContent(text);
    }
}