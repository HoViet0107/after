package personal.social.comment.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import personal.social.comment.application.dto.CommentDto;
import personal.social.comment.domain.model.PostComment;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    public void cacheComment(PostComment comment) {
        String key = "comment:" + comment;
        redisTemplate.opsForValue().set(key, comment, CACHE_TTL);
    }

    public CommentDto getComment(String commentId) {
        String key = "comment:" + commentId;
        return (CommentDto) redisTemplate.opsForValue().get(key);
    }

    public void cachePostComments(String postId, List<CommentDto> comments) {
        String key = "post:" + postId + ":comments";
        redisTemplate.opsForValue().set(key, comments, CACHE_TTL);
    }

    @SuppressWarnings("unchecked")
    public List<CommentDto> getPostComments(String postId) {
        String key = "post:" + postId + ":comments";
        return (List<CommentDto>) redisTemplate.opsForValue().get(key);
    }

    public void invalidateComment(String commentId) {
        redisTemplate.delete("comment:" + commentId);
    }

    public void invalidatePostComments(String postId) {
        redisTemplate.delete("post:" + postId + ":comments");
    }
}
