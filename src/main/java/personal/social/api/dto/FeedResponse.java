package personal.social.api.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class FeedResponse<T> {
    private List<T> content;
    private long totalElements;
    private boolean hasNext;
    private String clientType;
    private java.time.LocalDateTime timestamp;

    public FeedResponse(List<T> content, long totalElements, boolean hasNext, String clientType) {
        this.content = content;
        this.totalElements = totalElements;
        this.hasNext = hasNext;
        this.clientType = clientType;
        this.timestamp = java.time.LocalDateTime.now();
    }
}
