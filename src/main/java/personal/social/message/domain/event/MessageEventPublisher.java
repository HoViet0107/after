package personal.social.message.domain.event;

import personal.social.shared.domain.DomainEvent;
import java.util.List;

public interface MessageEventPublisher {
    void publishEvents(List<DomainEvent> events);
}
