package personal.social.user.domain.event;

import personal.social.user.domain.model.Users;

import personal.social.shared.domain.DomainEvent;
import java.util.List;

public interface UserEventPublisher {
    void publishEvents(List<DomainEvent> events);
}
