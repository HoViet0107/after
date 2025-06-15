package personal.social.post.domain.event;

import personal.social.shared.domain.DomainEvent;
import java.util.List;

public interface PostEventPublisher {
    void publishEvents(List<DomainEvent> events);
}
