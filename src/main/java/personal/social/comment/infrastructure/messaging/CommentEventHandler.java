package personal.social.comment.infrastructure.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import personal.social.comment.domain.event.CommentCreatedEvent;
import personal.social.comment.domain.event.CommentLikedEvent;
import personal.social.comment.infrastructure.redis.CommentCacheService;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommentEventHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final CommentCacheService cacheService;

    @EventListener
    public void handleCommentCreated(CommentCreatedEvent event) {
        log.info("Comment created: {}", event.commentId());

        // Invalidate cache
        cacheService.invalidatePostComments(event.postId().value());

        // Send real-time notification
        messagingTemplate.convertAndSend(
                "/topic/post/" + event.postId().value() + "/new-comment",
                event
        );
    }

    @EventListener
    public void handleCommentLiked(CommentLikedEvent event) {
        log.info("Comment liked: {}", event.commentId());

        // Invalidate cache
        cacheService.invalidateComment(event.commentId().value());

        // Send real-time notification
        messagingTemplate.convertAndSend(
                "/topic/comment/" + event.commentId().value() + "/liked",
                event
        );
    }
}
