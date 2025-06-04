package personal.social.validation.validators;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidMessageContentValidator implements ConstraintValidator<ValidMessageContent, String> {

    private int minLength;
    private int maxLength;
    private boolean allowEmpty;

    @Override
    public void initialize(ValidMessageContent constraintAnnotation) {
        this.minLength = constraintAnnotation.minLength();
        this.maxLength = constraintAnnotation.maxLength();
        this.allowEmpty = constraintAnnotation.allowEmpty();
    }

    @Override
    public boolean isValid(String content, ConstraintValidatorContext context) {
        if (content == null) {
            return allowEmpty;
        }

        String trimmed = content.trim();
        if (trimmed.isEmpty()) {
            return allowEmpty;
        }

        return trimmed.length() >= minLength && trimmed.length() <= maxLength;
    }
}
