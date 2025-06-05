package personal.social.shared.dto.cache;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class CacheStats {
    private long hitCount;
    private long missCount;
    private double hitRate;
    private long evictionCount;
}

