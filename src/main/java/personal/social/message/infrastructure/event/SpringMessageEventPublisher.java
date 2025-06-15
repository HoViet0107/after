package personal.social.message.infrastructure.event;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import personal.social.message.domain.event.MessageEventPublisher;
import personal.social.shared.domain.DomainEvent;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SpringMessageEventPublisher implements MessageEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEvents(List<DomainEvent> events) {
        events.forEach(eventPublisher::publishEvent);
    }
}
