package personal.social.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception class that represents a bad request error (HTTP 400).
 * <p>
 * This exception is automatically mapped to HTTP 400 BAD_REQUEST status
 * when thrown from a Spring REST controller or service layer.
 *
 * @see RuntimeException
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
