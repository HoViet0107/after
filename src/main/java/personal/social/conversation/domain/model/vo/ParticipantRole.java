package personal.social.conversation.domain.model.vo;

public enum ParticipantRole {
    ADMIN, VICE_ADMIN, PARTICIPANT, NOT_PARTICIPANT;

    @Override
    public String toString() {
        return this.name().toLowerCase();
    }
}
