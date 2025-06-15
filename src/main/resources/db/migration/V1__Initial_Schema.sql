-- MySQL Database Schema
CREATE DATABASE social_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE social_media;

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(155) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name NVARCHAR(255) NOT NULL,
    surname NVARCHAR(255),
    last_name NVARCHAR(255) NOT NULL,
    avatar_url TEXT,
    last_active TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    phone VARCHAR(12) UNIQUE,
    dob DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_id BIGINT,
    INDEX idx_users_email (email),
    INDEX idx_users_last_active (last_active),
    INDEX idx_users_online (is_online)
);

-- Roles table
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL UNIQUE
);

-- Posts table
CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE', 'DELETED') DEFAULT 'ACTIVE',
    visibility ENUM('PUBLIC', 'FRIENDS', 'PRIVATE') DEFAULT 'PUBLIC',
    location_name VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),

    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_posts_author_created (author_id, created_at DESC),
    INDEX idx_posts_status_created (status, created_at DESC),
    INDEX idx_posts_visibility (visibility),
    FULLTEXT idx_posts_content (content)
);

-- Post media table
CREATE TABLE post_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    media_url TEXT NOT NULL,
    media_type ENUM('IMAGE', 'VIDEO', 'GIF') NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    width INT,
    height INT,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_media_post (post_id)
);

-- Post hashtags table
CREATE TABLE post_hashtags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    hashtag VARCHAR(100) NOT NULL,

    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_hashtags_post (post_id),
    INDEX idx_hashtags_tag (hashtag),
    UNIQUE KEY unique_post_hashtag (post_id, hashtag)
);

-- Comments table
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL,
    status ENUM('ACTIVE', 'HIDDEN_BY_USER', 'DELETED_BY_OWNER', 'DELETED_BY_ADMIN', 'DELETED_BY_USER') NOT NULL DEFAULT 'ACTIVE',
    parent_comment_id VARCHAR(36) NULL,
    root_comment_id VARCHAR(36) NULL,

    INDEX idx_comment_post_id (post_id),
    INDEX idx_comment_author_id (author_id),
    INDEX idx_comment_parent_id (parent_comment_id),
    INDEX idx_comment_root_id (root_comment_id),
    INDEX idx_comment_created_at (created_at),

    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (root_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Comment likes table
CREATE TABLE comment_likes (
    id VARCHAR(36) PRIMARY KEY,
    comment_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_comment_like (comment_id, user_id),
    INDEX idx_comment_like_comment_id (comment_id),
    INDEX idx_comment_like_user_id (user_id),

    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comment media table
CREATE TABLE comment_media (
    id VARCHAR(36) PRIMARY KEY,
    comment_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT') NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(200),
    width INT,
    height INT,
    file_size BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_comment_media_comment_id (comment_id),

    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Comment tags table
CREATE TABLE comment_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    comment_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_comment_tag (comment_id, user_id),
    INDEX idx_comment_tag_comment_id (comment_id),
    INDEX idx_comment_tag_user_id (user_id),

    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Follows table
CREATE TABLE user_follows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    followed_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_follow (follower_id, followed_id),
    INDEX idx_follows_follower (follower_id),
    INDEX idx_follows_followed (followed_id)
);

-- Conversations table
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title TEXT NOT NULL,
    avatar_url TEXT,
    is_group_chat BOOLEAN DEFAULT FALSE,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_id BIGINT,

    INDEX idx_conversations_updated (edited_at DESC),
    INDEX idx_conversations_type (is_group_chat)
);

-- Conversation participants table
CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    participant_role ENUM('ADMIN', 'VICE_ADMIN', 'PARTICIPANT', 'NOT_PARTICIPANT') DEFAULT 'PARTICIPANT',

    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_participants_user (user_id),
    INDEX idx_participants_role (participant_role)
);

-- Messages table
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_content TEXT NOT NULL,
    send_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    message_status ENUM('SENDING', 'SENT', 'DELIVERED', 'SEEN', 'FAILED') DEFAULT 'SENT',
    message_type ENUM('TEXT', 'MESSAGE_READ', 'MESSAGE_DELETED', 'USER_TYPING', 'USER_ONLINE', 'USER_OFFLINE', 'NEW_CONVERSATION') DEFAULT 'TEXT',
    reply_to_message_id BIGINT,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,

    INDEX idx_messages_conversation_time (conversation_id, send_at DESC),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_status (message_status),
    INDEX idx_messages_reply (reply_to_message_id)
);

-- Message read status table
CREATE TABLE message_read_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_message_user_read (message_id, user_id),
    INDEX idx_read_status_user (user_id),
    INDEX idx_read_status_read (is_read)
);

-- Message reactions table
CREATE TABLE message_reactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL, -- like, love, haha, wow, sad, angry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_message_user_reaction (message_id, user_id),
    INDEX idx_reactions_message (message_id),
    INDEX idx_reactions_type (reaction_type)
);

-- Message media table
CREATE TABLE message_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    media_url TEXT NOT NULL,
    media_type ENUM('IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'GIF') NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT,
    duration INT, -- for audio/video
    width INT,    -- for images/video
    height INT,   -- for images/video

    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message_media_message (message_id)
);