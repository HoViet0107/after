package personal.social.auth.application.service;

import personal.social.auth.application.dto.in.LoginRequest;
import personal.social.shared.infrastructure.exception.CustomValidationException;

import java.util.HashMap;
import java.util.Map;

public class LoginRequestValidator {

    public static void validateLoginRequest(LoginRequest request) {
        CustomValidationException exception = new CustomValidationException("Validation failed");
        try {
            validateEmail(request.email());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

        try {
            validatePassword(request.password());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

        if (exception.hasErrors()) {
            throw exception;
        }
        // Additional validation logic can be added here
    }

    public static void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email must not be empty");
        }
        if (!email.matches("^[\\w-.]+@[\\w-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    public static void validatePassword(String password) {
        Map<String, String> details = new HashMap<>();
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }
    }
}
