package personal.social.exceptions;

import lombok.Data;

import java.util.Map;

/**
 * Represents an API error response with status code, message, and timestamp.
 * Supports optional field-level validation errors for detailed error reporting.
 *
 * @see lombok.Data for auto-generated getters, setters, and other methods
 */
@Data
public class ApiError {
    private int status;
    private String message;
    private long timestamp;
    private Map<String, String> errors;

    /**
     * Constructs an ApiError with basic error information.
     *
     * @param status    the HTTP status code
     * @param message   the error message
     * @param timestamp the time when the error occurred (in milliseconds)
     */
    public ApiError(int status, String message, long timestamp) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }

    /**
     * Constructs an ApiError with basic error information.
     *
     * @param status    the HTTP status code
     * @param message   the error message
     * @param timestamp the time when the error occurred (in milliseconds)
     */
    public ApiError(int status, String message, long timestamp, Map<String, String> errors) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
        this.errors = errors;
    }
}
