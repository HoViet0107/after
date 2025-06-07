package personal.social.post.application.usecase;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.post.domain.event.PostEventPublisher;
import personal.social.post.domain.exception.PostNotFoundException;
import personal.social.post.domain.model.Post;
import personal.social.post.domain.model.vo.PostId;
import personal.social.post.domain.repository.PostRepository;
import personal.social.user.domain.model.vo.UserId;

@Service
@Transactional
@RequiredArgsConstructor
public class LikePostUseCase {

    private final PostRepository postRepository;
    private final PostEventPublisher eventPublisher;

    public void execute(String postId, String userId) {
        Post post = postRepository.findById(PostId.of(postId))
                .orElseThrow(() -> new PostNotFoundException("Post not found: " + postId));

        post.like(UserId.of(userId));

        Post savedPost = postRepository.save(post);
        eventPublisher.publishEvents(savedPost.getDomainEvents());
        savedPost.clearDomainEvents();
    }

    public void unlike(String postId, String userId) {
        Post post = postRepository.findById(PostId.of(postId))
                .orElseThrow(() -> new PostNotFoundException("Post not found: " + postId));

        post.unlike(UserId.of(userId));
        postRepository.save(post);
    }
}
