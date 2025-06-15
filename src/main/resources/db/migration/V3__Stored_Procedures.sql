DELIMITER //

-- Optimized feed generation procedure
CREATE PROCEDURE GetUserFeed(
    IN userId BIGINT,
    IN pageSize INT,
    IN offsetValue INT,
    IN followingOnly BOOLEAN
)
BEGIN
    IF followingOnly THEN
        SELECT p.id, p.content, p.created_at, p.author_id,
               u.username, u.first_name, u.last_name, u.avatar_url,
               (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'ACTIVE') as comment_count,
               EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = userId) as user_liked
        FROM posts p
        JOIN users u ON p.author_id = u.id
        JOIN user_follows f ON p.author_id = f.followed_id
        WHERE f.follower_id = userId
          AND p.status = 'ACTIVE'
          AND p.visibility IN ('PUBLIC', 'FRIENDS')
        ORDER BY p.created_at DESC
        LIMIT pageSize OFFSET offsetValue;
    ELSE
        SELECT p.id, p.content, p.created_at, p.author_id,
               u.username, u.first_name, u.last_name, u.avatar_url,
               (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'ACTIVE') as comment_count,
               EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = userId) as user_liked
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.status = 'ACTIVE'
          AND p.visibility = 'PUBLIC'
        ORDER BY p.created_at DESC
        LIMIT pageSize OFFSET offsetValue;
    END IF;
END //

-- Conversation history with read status
CREATE PROCEDURE GetConversationHistory(
    IN conversationId BIGINT,
    IN userId BIGINT,
    IN pageSize INT,
    IN offsetValue INT
)
BEGIN
    SELECT m.id, m.message_content, m.send_at, m.edited_at,
           m.message_status, m.is_deleted, m.reply_to_message_id,
           u.username, u.first_name, u.last_name, u.avatar_url,
           COALESCE(mrs.is_read, FALSE) as is_read,
           mrs.read_at
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = userId
    WHERE m.conversation_id = conversationId
      AND m.is_deleted = FALSE
    ORDER BY m.send_at DESC
    LIMIT pageSize OFFSET offsetValue;
END //

-- Mark messages as read efficiently
CREATE PROCEDURE MarkMessagesAsRead(
    IN userId BIGINT,
    IN conversationId BIGINT
)
BEGIN
    INSERT INTO message_read_status (message_id, user_id, read_at, is_read)
    SELECT m.id, userId, NOW(), TRUE
    FROM messages m
    WHERE m.conversation_id = conversationId
      AND m.sender_id != userId
      AND NOT EXISTS (
          SELECT 1 FROM message_read_status mrs
          WHERE mrs.message_id = m.id AND mrs.user_id = userId
      )
    ON DUPLICATE KEY UPDATE
        read_at = NOW(),
        is_read = TRUE;
END //

-- Get trending hashtags
CREATE PROCEDURE GetTrendingHashtags(
    IN timeHours INT,
    IN limitCount INT
)
BEGIN
    SELECT ph.hashtag, COUNT(*) as usage_count
    FROM post_hashtags ph
    JOIN posts p ON ph.post_id = p.id
    WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL timeHours HOUR)
      AND p.status = 'ACTIVE'
    GROUP BY ph.hashtag
    ORDER BY usage_count DESC
    LIMIT limitCount;
END //

DELIMITER ;