package personal.social.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Generic API response wrapper for standardizing REST API responses.
 * Provides a consistent structure for both successful and error responses
 * with support for generic data types, error details, and automatic timestamping.
 *
 * @param <T> the type of data payload in the response
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private Map<String, String> errors;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Static factory method to create a successful API response
     * with given data and default message "Success".
     *
     * @param data the data to be returned in the response
     * @param <T>  the type of data
     * @return a successful API response
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .build();
    }

    /**
     * Static factory method to create a successful API response
     * with given data and given message.
     *
     * @param data    the data to be returned in the response
     * @param message the message to be returned in the response
     * @param <T>     the type of data
     * @return a successful API response
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Static factory method to create an error API response
     * with the given message and no additional error details.
     *
     * @param message the error message to be returned in the response
     * @param <T>     the type of data
     * @return an error API response
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }

    /**
     * Static factory method to create an error API response
     * with the given message and a map of additional error details.
     *
     * @param message the error message to be returned in the response
     * @param errors  a map containing field-level error messages
     * @param <T>     the type of data
     * @return an error API response
     */
    public static <T> ApiResponse<T> error(String message, Map<String, String> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(errors)
                .build();
    }
}
