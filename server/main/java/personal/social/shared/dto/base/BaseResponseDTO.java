package personal.social.shared.dto.base;

import java.time.LocalDateTime;

public abstract class BaseResponseDTO {
    private LocalDateTime timestamp;
    private String version;

    protected BaseResponseDTO() {
        this.timestamp = LocalDateTime.now();
        this.version = "1.0";
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public String getVersion() { return version; }
}
