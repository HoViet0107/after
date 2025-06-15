package personal.social.comment.infrastructure.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import personal.social.shared.domain.DomainEvent;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CommentEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishEvents(List<DomainEvent> events) {
        events.forEach(applicationEventPublisher::publishEvent);
    }
}
