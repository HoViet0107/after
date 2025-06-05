package personal.social.messaging.domain.model;

public record MessageContent(String text) {
    public MessageContent {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be null or empty");
        }
        if (text.length() > 1000) {
            throw new IllegalArgumentException("Message content too long");
        }
    }

    public static MessageContent of(String text) {
        return new MessageContent(text);
    }
}
