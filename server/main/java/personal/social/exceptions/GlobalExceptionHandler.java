package personal.social.exceptions;

import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import personal.social.payload.ApiResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for REST API endpoints.
 * <p>
 * Provides centralized exception handling across all controllers, converting various
 * exception types into standardized ApiResponse objects with appropriate HTTP status codes.
 * Handles resource not found, bad request, authentication, authorization, validation,
 * and general server errors.
 *
 * @since 1.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles ResourceNotFoundException by returning a 404 NOT_FOUND response
     * with a standardized ApiError containing the original exception message.
     *
     * @param ex the ResourceNotFoundException to handle
     * @return an ApiResponse with HTTP status 404 NOT_FOUND containing the error message
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<?> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ApiResponse.error(ex.getMessage());
    }

    /**
     * Handles BadRequestException by returning a 400 BAD_REQUEST response
     * with a standardized ApiError containing the original exception message.
     *
     * @param ex the BadRequestException to handle
     * @return an ApiResponse with HTTP status 400 BAD_REQUEST containing the error message
     */
    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleBadRequestException(BadRequestException ex) {
        return ApiResponse.error(ex.getMessage());
    }

    /**
     * Handles AuthenticationException by returning a 401 UNAUTHORIZED response
     * with a standardized ApiError containing the original exception message.
     *
     * @param ex the AuthenticationException to handle
     * @return an ApiResponse with HTTP status 401 UNAUTHORIZED containing the error message
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<?> handleAuthenticationException(AuthenticationException ex) {
        return ApiResponse.error("Authentication failed: " + ex.getMessage());
    }

    /**
     * Handles AccessDeniedException by returning a 403 FORBIDDEN response
     * with a standardized ApiError containing the original exception message.
     *
     * @param ex the AccessDeniedException to handle
     * @return an ApiResponse with HTTP status 403 FORBIDDEN containing the error message
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<?> handleAccessDeniedException(AccessDeniedException ex) {
        return ApiResponse.error("Access denied: " + ex.getMessage());
    }

    /**
     * Handles MethodArgumentNotValidException by returning a 400 BAD_REQUEST response
     * with a standardized ApiError containing a map of field-level validation errors.
     *
     * @param ex the MethodArgumentNotValidException to handle
     * @return an ApiResponse with HTTP status 400 BAD_REQUEST containing the validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ApiResponse.error("Validation failed", errors);
    }

    /**
     * Handles all uncaught exceptions by returning a 500 INTERNAL_SERVER_ERROR response
     * with a standardized ApiError containing the original exception message.
     * <p>
     * This handler is used as a catch-all for any exceptions that are not explicitly handled
     * by other exception handlers in this class.
     *
     * @param ex the Exception to handle
     * @return an ApiResponse with HTTP status 500 INTERNAL_SERVER_ERROR containing the error message
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleAllUncaughtException(Exception ex) {
        return ApiResponse.error("Internal server error: " + ex.getMessage());
    }
}