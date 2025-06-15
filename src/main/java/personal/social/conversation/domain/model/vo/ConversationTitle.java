package personal.social.conversation.domain.model.vo;

public record ConversationTitle(String value) {
    public ConversationTitle {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Conversation title cannot be empty");
        }
        if (value.length() > 100) {
            throw new IllegalArgumentException("Conversation title too long");
        }
    }

    public static ConversationTitle of(String value) {
        return new ConversationTitle(value);
    }
}
