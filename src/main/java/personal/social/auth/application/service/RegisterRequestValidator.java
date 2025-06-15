package personal.social.auth.application.service;

import personal.social.auth.application.dto.in.RegisterRequest;
import personal.social.shared.infrastructure.exception.CustomValidationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;

public class RegisterRequestValidator {
    private final static int MINIMUM_AGE = 13;

    /**
     * Validates the registration request.
     *
     * @param request The registration request to validate.
     * @throws IllegalArgumentException if the request is invalid.
     */
    public static void validateRegisterRequest(RegisterRequest request) {
        CustomValidationException exception = new CustomValidationException("Validation failed");

        try {
            validateNames(request.firstName(), request.middleName(), request.lastName());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

        try {
            validatePhoneNumber(request.phoneNumber());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

        try{
            validateGender(request.gender());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

        try {
            validateDob(request.dob());
        } catch (IllegalArgumentException e) {
            exception.addError(e.getMessage());
        }

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

    public static void validateNames(String firstName, String middleName, String lastName) {
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("First name must not be empty");
        }
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Last name must not be empty");
        }

        if (firstName.startsWith(" ") || firstName.endsWith(" ") ||
                lastName.startsWith(" ") || lastName.endsWith(" ")) {
            throw new IllegalArgumentException("Names cannot start or end with a space");
        }
    }

    public static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number must not be empty");
        }

        if (!phoneNumber.matches("^\\+?[0-9]{10,15}$")) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
    }

    public static void validateDob(LocalDateTime dob) {
        if (dob == null) {
            throw new IllegalArgumentException("Date of birth must not be empty");
        }

        LocalDateTime now = LocalDateTime.now();

        // Check if date of birth is in the future
        if (dob.isAfter(now)) {
            throw new IllegalArgumentException("Date of birth cannot be in the future");
        }
        // Check if date of birth is too far in the past
        if (dob.isBefore(now.minusYears(150))) {
            throw new IllegalArgumentException("Date of birth cannot be more than 120 years in the past");
        }

        // Convert to LocalDate for accurate age calculation
        LocalDate dobDate = dob.toLocalDate();
        LocalDate currentDate = now.toLocalDate();

        // Calculate age
        Period age = Period.between(dobDate, currentDate);

        // Check if user is at least 13 years old
        if (age.getYears() < MINIMUM_AGE ||
                (age.getYears() == MINIMUM_AGE && (age.getMonths() < 0 || (age.getMonths() == 0 && age.getDays() < 0)))) {
            throw new IllegalArgumentException(String.format("You must be at least %d to join", MINIMUM_AGE));
        }
    }

    public static void validateGender(String gender){
        if(gender == null || gender.isBlank()){
            throw new IllegalArgumentException("Gender must not be empty");
        }
    }
}
