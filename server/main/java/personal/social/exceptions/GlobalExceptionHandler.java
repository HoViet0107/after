package personal.social.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the application that intercepts and handles various exceptions
 * thrown across all controllers. Provides centralized error handling and consistent API error
 * responses using the ApiError format.
 * <p>
 * Handles the following exceptions:
 * <li> ResourceNotFoundException: Returns 404 NOT_FOUND
 * <li> UnauthorizedException: Returns 401 UNAUTHORIZED
 * <li> ForbiddenException: Returns 403 FORBIDDEN
 * <li> MethodArgumentNotValidException: Returns 400 BAD_REQUEST with validation errors
 * <li> General Exception: Returns 500 INTERNAL_SERVER_ERROR as fallback
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles ResourceNotFoundException by returning a 404 NOT_FOUND response with an ApiError containing the original
     * exception message and current timestamp.
     *
     * @param ex the ResourceNotFoundException to handle
     * @return a ResponseEntity containing an ApiError with HTTP status 404 NOT_FOUND
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                System.currentTimeMillis()
        );
        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    /**
     * Handles UnauthorizedException by returning a 401 UNAUTHORIZED response with an ApiError containing the original
     * exception message and current timestamp.
     *
     * @param ex the UnauthorizedException to handle
     * @return a ResponseEntity containing an ApiError with HTTP status 401 UNAUTHORIZED
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorizedException(UnauthorizedException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                System.currentTimeMillis()
        );
        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handles ForbiddenException by returning a 403 FORBIDDEN response with an ApiError containing the original
     * exception message and current timestamp.
     *
     * @param ex the ForbiddenException to handle
     * @return a ResponseEntity containing an ApiError with HTTP status 403 FORBIDDEN
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbiddenException(ForbiddenException ex) {
        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                System.currentTimeMillis()
        );
        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    /**
     * Handles MethodArgumentNotValidException by returning a 400 BAD_REQUEST response with an ApiError containing a map
     * of field names to validation error messages.
     *
     * @param ex the MethodArgumentNotValidException to handle
     * @return a ResponseEntity containing an ApiError with HTTP status 400 BAD_REQUEST
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                System.currentTimeMillis(),
                errors
        );
        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles all uncaught exceptions by returning a 500 INTERNAL_SERVER_ERROR response with a generic
     * error message and current timestamp.
     *
     * @param ex the Exception to handle
     * @return a ResponseEntity containing an ApiError with HTTP status 500 INTERNAL_SERVER_ERROR
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllExceptions(Exception ex) {
        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error",
                System.currentTimeMillis()
        );
        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

