package personal.social.message.domain.model.vo;

import java.util.UUID;

public record ConversationId(String value) {
    public ConversationId {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Conversation ID cannot be null or empty");
        }
    }

    public static ConversationId of(String value) {
        return new ConversationId(value);
    }

    public static ConversationId generate() {
        return new ConversationId(UUID.randomUUID().toString()); // Simplified ID generation
    }
}
