package personal.social.feed.infrastructure.event;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import personal.social.feed.domain.event.PostEventPublisher;
import personal.social.shared.domain.DomainEvent;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SpringPostEventPublisher implements PostEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEvents(List<DomainEvent> events) {
        events.forEach(eventPublisher::publishEvent);
    }
}
