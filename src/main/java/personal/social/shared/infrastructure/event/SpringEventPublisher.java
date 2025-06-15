package personal.social.shared.infrastructure.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import personal.social.shared.domain.DomainEvent;
import personal.social.shared.infrastructure.exception.EventPublishingException;
import personal.social.shared.domain.event.EventPublisher;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SpringEventPublisher implements EventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEvents(List<DomainEvent> events) {
        events.forEach(event -> {
            try {
                eventPublisher.publishEvent(event);
                log.debug("Published event: {}", event);
            } catch (Exception e) {
                log.error("Failed to publish event: {}", event, e);
                throw new EventPublishingException("Failed to publish event", e);
            }
        });
    }
}