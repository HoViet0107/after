package personal.social.messaging.domain.model;

public record ConversationId(String value) {
    public ConversationId {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Conversation ID cannot be null or empty");
        }
    }

    public static ConversationId of(String value) {
        return new ConversationId(value);
    }
}
