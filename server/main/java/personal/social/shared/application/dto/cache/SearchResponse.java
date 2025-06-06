package personal.social.shared.application.dto.cache;

import java.util.List;

public record SearchResponse(
        List<Object> results,
        long totalCount,
        String query,
        int page
) {}
