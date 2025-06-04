package personal.social.dto.common;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorResponse<T> {
    private List<T> data;
    private LocalDateTime nextCursor;
    private boolean hasNext;
    private int totalCount;
    private PaginationMeta meta;

    @Data
    @Builder
    public static class PaginationMeta {
        private int pageSize;
        private int currentPage;
        private boolean isFirstPage;
        private boolean isLastPage;
    }
}
