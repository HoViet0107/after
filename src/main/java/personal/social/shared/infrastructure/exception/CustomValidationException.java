package personal.social.shared.infrastructure.exception;

import lombok.Getter;

import java.util.HashSet;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

@Getter
public class CustomValidationException extends RuntimeException {
    private final Set<String> errors = new HashSet<>();

    public CustomValidationException(String message) {
        super(message);
    }

    public void addError( String message) {
        errors.add(message);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}