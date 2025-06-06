package personal.social.user.infrastructure.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import personal.social.shared.domain.DomainEvent;
import personal.social.user.domain.event.UserEventPublisher;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SpringUserEventPublisher implements UserEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEvents(List<DomainEvent> events) {
        events.forEach(eventPublisher::publishEvent);
    }
}
