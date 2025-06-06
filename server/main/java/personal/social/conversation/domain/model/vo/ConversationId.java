package personal.social.conversation.domain.model.vo;

import personal.social.shared.domain.vo.IdGenerator;

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
        return new ConversationId(IdGenerator.generate());
    }
}
