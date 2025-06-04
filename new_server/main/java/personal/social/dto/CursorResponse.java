package personal.social.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CursorResponse<T> {
    List<T> data;
    int totalCount;
    LocalDateTime nextCursor;
    boolean hasNext;
}
