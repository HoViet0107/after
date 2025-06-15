package personal.social.user.domain.event;

import personal.social.user.domain.model.Users;


public interface DomainUserEventPublisher {
    void publishUserProfileUpdated(Users user);
}
