package personal.social.shared.application.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BaseResponse<T> {
    private T data;
    private String message;
    private long timestamp;
    private String requestId;
    private boolean success;

    // Static factory methods
    public BaseResponse(T data, String message) {
        this.setData(data);
        this.setMessage(message);
        this.setTimestamp(System.currentTimeMillis());
        this.setSuccess(true);
    }
}
