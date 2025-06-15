package personal.social.user.infrastructure.event;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.social.shared.domain.event.EventPublisher;
import personal.social.user.domain.event.DomainUserEventPublisher;
import personal.social.user.domain.event.UserProfileUpdatedEvent;
import personal.social.user.domain.model.Users;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserEventPublisher implements DomainUserEventPublisher {

    private final EventPublisher eventPublisher;

    @Override
    public void publishUserProfileUpdated(Users user) {
        UserProfileUpdatedEvent event = new UserProfileUpdatedEvent(
                user.getId().value(),
                user.getProfile().getFullName()
        );
        eventPublisher.publishEvents(List.of(event));
    }
}
