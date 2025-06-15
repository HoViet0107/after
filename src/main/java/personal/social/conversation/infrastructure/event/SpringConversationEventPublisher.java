package personal.social.conversation.infrastructure.event;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import personal.social.conversation.domain.event.ConversationEventPublisher;
import personal.social.shared.domain.DomainEvent;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SpringConversationEventPublisher implements ConversationEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void publishEvents(List<DomainEvent> events) {
        events.forEach(eventPublisher::publishEvent);
    }
}
