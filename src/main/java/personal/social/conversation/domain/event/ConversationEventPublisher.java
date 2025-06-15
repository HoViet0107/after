package personal.social.conversation.domain.event;

import personal.social.shared.domain.DomainEvent;
import java.util.List;

public interface ConversationEventPublisher {
    void publishEvents(List<DomainEvent> events);
}
