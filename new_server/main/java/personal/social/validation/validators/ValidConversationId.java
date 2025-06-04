package personal.social.validation.validators;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidConversationIdValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidConversationId {
    String message() default "Invalid conversation ID";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
