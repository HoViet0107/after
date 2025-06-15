package personal.social.shared.domain.event;

import personal.social.user.domain.event.UserProfileUpdatedEvent;
import personal.social.user.domain.model.Users;
import personal.social.shared.domain.DomainEvent;
import java.util.List;

public interface EventPublisher {
    void publishEvents(List<DomainEvent> events);
}
