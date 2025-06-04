package personal.social.validation.validators;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import personal.social.repository.ConversationRepository;

@RequiredArgsConstructor
public class ValidConversationIdValidator implements ConstraintValidator<ValidConversationId, Long> {

    private final ConversationRepository conversationRepository;

    @Override
    public boolean isValid(Long conversationId, ConstraintValidatorContext context) {
        if (conversationId == null) {
            return false;
        }
        return conversationRepository.existsById(conversationId);
    }
}
