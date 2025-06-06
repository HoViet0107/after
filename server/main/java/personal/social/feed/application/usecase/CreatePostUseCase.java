package personal.social.feed.application.usecase;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.feed.application.dto.in.CreatePostRequest;
import personal.social.feed.application.dto.out.PostResponse;
import personal.social.feed.domain.model.Post;
import personal.social.feed.application.dto.CreatePostRequest;
import personal.social.feed.application.dto.PostResponse;
import personal.social.feed.domain.event.PostEventPublisher;
import personal.social.feed.domain.model.Post;
import personal.social.feed.domain.model.PostHashTag;
import personal.social.feed.domain.model.enums.PostVisibility;
import personal.social.feed.domain.model.vo.PostContent;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.feed.domain.repository.PostRepository;
import personal.social.user.domain.model.vo.UserId;

@Service
@Transactional
@RequiredArgsConstructor
public class CreatePostUseCase {

    private final PostRepository postRepository;
    private final PostEventPublisher eventPublisher;

    public PostResponse execute(CreatePostRequest request) {
        // Create post
        Post post = Post.create(
                PostId.generate(),
                UserId.of(request.authorId()),
                PostContent.of(request.content()),
                PostVisibility.valueOf(request.visibility().toUpperCase())
        );

        // Add hashtags
        request.hashtags().forEach(tag -> {
            PostHashTag hashtag = PostHashTag.create(tag, post.getId());
            post.addHashtag(hashtag);
        });

        // Tag users
        request.taggedUserIds().forEach(userId -> {
            post.tagUser(UserId.of(userId));
        });

        // Save post
        Post savedPost = postRepository.save(post);

        // Publish events
        eventPublisher.publishEvents(savedPost.getDomainEvents());
        savedPost.clearDomainEvents();

        return PostResponse.from(savedPost);
    }
}

