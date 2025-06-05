-- Additional performance indexes for social media queries

-- Feed generation optimization
CREATE INDEX idx_posts_feed_optimization
ON posts(created_at DESC, author_id, visibility, status);

-- User activity tracking
CREATE INDEX idx_users_activity_tracking
ON users(last_active DESC, is_online);

-- Hashtag trending analysis
CREATE INDEX idx_hashtags_trending
ON post_hashtags(hashtag, id);

-- Comment threading
CREATE INDEX idx_comments_threading
ON comments(post_id, parent_comment_id, created_at ASC);

-- Message threading and search
CREATE INDEX idx_messages_thread_search
ON messages(conversation_id, created_at ASC, is_deleted);

-- Engagement analytics
CREATE INDEX idx_likes_analytics
ON post_likes(created_at DESC, post_id);

CREATE INDEX idx_comment_likes_analytics
ON comment_likes(created_at DESC, comment_id);

-- Follow relationships for feed
CREATE INDEX idx_follows_feed_generation
ON user_follows(follower_id, created_at DESC);

-- Conversation access patterns
CREATE INDEX idx_participants_access
ON conversation_participants(user_id, participant_role, conversation_id);

-- Read status queries
CREATE INDEX idx_read_status_unread
ON message_read_status(user_id, is_read, message_id);
