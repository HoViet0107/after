package personal.social.post.domain.repository;

import personal.social.post.domain.model.Post;
import personal.social.post.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

public interface PostRepository {
    Post save(Post post);
    Optional<Post> findById(PostId id);
    List<Post> findByAuthor(UserId authorId);
    List<Post> findPublicPosts();
    void delete(PostId id);
    boolean existsById(PostId id);

    List<String> findTrendingPostIds(int i);
}
