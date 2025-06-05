package personal.social.shared.dto.cache;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

// Search filters DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchFilters {
    private String contentType;
    private LocalDateTime dateFrom;
    private LocalDateTime dateTo;
    private Set<String> hashtags;

    @Override
    public int hashCode() {
        return java.util.Objects.hash(contentType, dateFrom, dateTo, hashtags);
    }
}
