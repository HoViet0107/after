package personal.social.comment.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import personal.social.comment.application.dto.CommentDto;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    public void cacheComment(Long comment) {
        String key = "comment:" + comment.id();
        redisTemplate.opsForValue().set(key, comment, CACHE_TTL);
    }

    public CommentDto getComment(Long commentId) {
        String key = "comment:" + commentId;
        return (CommentDto) redisTemplate.opsForValue().get(key);
    }

    public void cachePostComments(Long postId, List<CommentDto> comments) {
        String key = "post:" + postId + ":comments";
        redisTemplate.opsForValue().set(key, comments, CACHE_TTL);
    }

    @SuppressWarnings("unchecked")
    public List<CommentDto> getPostComments(Long postId) {
        String key = "post:" + postId + ":comments";
        return (List<CommentDto>) redisTemplate.opsForValue().get(key);
    }

    public void invalidateComment(Long commentId) {
        redisTemplate.delete("comment:" + commentId);
    }

    public void invalidatePostComments(Long postId) {
        redisTemplate.delete("post:" + postId + ":comments");
    }
}
