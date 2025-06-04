package personal.social.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import personal.social.services.CachingService;
import personal.social.dto.message.ChatMessageDTO;
import personal.social.dto.conversation.ConversationRequest;
import personal.social.model.Users;
import personal.social.services.RedisService;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachingServiceImpl implements CachingService {

    private final RedisService redisService;

    // Cache Keys
    private static final String USER_BY_ID_KEY = "cache:user:id:%d";
    private static final String USER_BY_EMAIL_KEY = "cache:user:email:%s";
    private static final String MESSAGE_KEY = "cache:message:%d";
    private static final String CONVERSATION_MESSAGES_KEY = "cache:conversation:messages:%d";
    private static final String CONVERSATION_KEY = "cache:conversation:%d";
    private static final String USER_CONVERSATIONS_KEY = "cache:user:conversations:%d";
    private static final String UNREAD_COUNT_KEY = "cache:unread:%d:%d";
    private static final String ONLINE_USERS_KEY = "cache:online:users";

    // Default TTL
    private static final Duration DEFAULT_TTL = Duration.ofHours(1);
    private static final Duration USER_TTL = Duration.ofHours(6);
    private static final Duration MESSAGE_TTL = Duration.ofHours(2);
    private static final Duration CONVERSATION_TTL = Duration.ofMinutes(30);

    // User Caching
    @Override
    public void cacheUser(Users user) {
        cacheUser(user, USER_TTL);
    }

    @Override
    public void cacheUser(Users user, Duration ttl) {
        try {
            String idKey = String.format(USER_BY_ID_KEY, user.getId());
            String emailKey = String.format(USER_BY_EMAIL_KEY, user.getEmail());

            redisService.set(idKey, user, ttl);
            redisService.set(emailKey, user, ttl);

            log.debug("Cached user: {} with TTL: {}", user.getId(), ttl);
        } catch (Exception e) {
            log.error("Error caching user: {}", user.getId(), e);
        }
    }

    @Override
    public Optional<Users> getCachedUser(Long userId) {
        try {
            String key = String.format(USER_BY_ID_KEY, userId);
            Users user = redisService.get(key, Users.class);
            return Optional.ofNullable(user);
        } catch (Exception e) {
            log.error("Error getting cached user: {}", userId, e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<Users> getCachedUserByEmail(String email) {
        try {
            String key = String.format(USER_BY_EMAIL_KEY, email);
            Users user = redisService.get(key, Users.class);
            return Optional.ofNullable(user);
        } catch (Exception e) {
            log.error("Error getting cached user by email: {}", email, e);
            return Optional.empty();
        }
    }

    @Override
    public void evictUser(Long userId) {
        try {
            String key = String.format(USER_BY_ID_KEY, userId);
            redisService.delete(key);
            log.debug("Evicted user cache: {}", userId);
        } catch (Exception e) {
            log.error("Error evicting user cache: {}", userId, e);
        }
    }

    @Override
    public void evictUserByEmail(String email) {
        try {
            String key = String.format(USER_BY_EMAIL_KEY, email);
            redisService.delete(key);
            log.debug("Evicted user cache by email: {}", email);
        } catch (Exception e) {
            log.error("Error evicting user cache by email: {}", email, e);
        }
    }

    // Message Caching
    @Override
    public void cacheMessage(ChatMessageDTO message) {
        try {
            String key = String.format(MESSAGE_KEY, message.getId());
            redisService.set(key, message, MESSAGE_TTL);
            log.debug("Cached message: {}", message.getId());
        } catch (Exception e) {
            log.error("Error caching message: {}", message.getId(), e);
        }
    }

    @Override
    public void cacheMessages(List<ChatMessageDTO> messages, Long conversationId) {
        try {
            String key = String.format(CONVERSATION_MESSAGES_KEY, conversationId);
            redisService.set(key, messages, MESSAGE_TTL);

            // Also cache individual messages
            messages.forEach(this::cacheMessage);

            log.debug("Cached {} messages for conversation: {}", messages.size(), conversationId);
        } catch (Exception e) {
            log.error("Error caching messages for conversation: {}", conversationId, e);
        }
    }

    @Override
    public Optional<ChatMessageDTO> getCachedMessage(Long messageId) {
        try {
            String key = String.format(MESSAGE_KEY, messageId);
            ChatMessageDTO message = redisService.get(key, ChatMessageDTO.class);
            return Optional.ofNullable(message);
        } catch (Exception e) {
            log.error("Error getting cached message: {}", messageId, e);
            return Optional.empty();
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<ChatMessageDTO> getCachedMessages(Long conversationId, int page, int size) {
        try {
            String key = String.format(CONVERSATION_MESSAGES_KEY, conversationId);
            List<ChatMessageDTO> messages = (List<ChatMessageDTO>) redisService.get(key, List.class);

            if (messages != null) {
                // Simple pagination logic
                int start = page * size;
                int end = Math.min(start + size, messages.size());
                if (start < messages.size()) {
                    return messages.subList(start, end);
                }
            }
            return List.of();
        } catch (Exception e) {
            log.error("Error getting cached messages for conversation: {}", conversationId, e);
            return List.of();
        }
    }

    @Override
    public void evictMessage(Long messageId) {
        try {
            String key = String.format(MESSAGE_KEY, messageId);
            redisService.delete(key);
            log.debug("Evicted message cache: {}", messageId);
        } catch (Exception e) {
            log.error("Error evicting message cache: {}", messageId, e);
        }
    }

    @Override
    public void evictConversationMessages(Long conversationId) {
        try {
            String key = String.format(CONVERSATION_MESSAGES_KEY, conversationId);
            redisService.delete(key);
            log.debug("Evicted conversation messages cache: {}", conversationId);
        } catch (Exception e) {
            log.error("Error evicting conversation messages cache: {}", conversationId, e);
        }
    }

    // Conversation Caching
    @Override
    public void cacheConversation(ConversationRequest conversation) {
        try {
            String key = String.format(CONVERSATION_KEY, conversation.getId());
            redisService.set(key, conversation, CONVERSATION_TTL);
            log.debug("Cached conversation: {}", conversation.getId());
        } catch (Exception e) {
            log.error("Error caching conversation: {}", conversation.getId(), e);
        }
    }

    @Override
    public Optional<ConversationRequest> getCachedConversation(Long conversationId) {
        try {
            String key = String.format(CONVERSATION_KEY, conversationId);
            ConversationRequest conversation = redisService.get(key, ConversationRequest.class);
            return Optional.ofNullable(conversation);
        } catch (Exception e) {
            log.error("Error getting cached conversation: {}", conversationId, e);
            return Optional.empty();
        }
    }

    @Override
    public void cacheUserConversations(Long userId, List<ConversationRequest> conversations) {
        try {
            String key = String.format(USER_CONVERSATIONS_KEY, userId);
            redisService.set(key, conversations, CONVERSATION_TTL);

            // Also cache individual conversations
            conversations.forEach(this::cacheConversation);

            log.debug("Cached {} conversations for user: {}", conversations.size(), userId);
        } catch (Exception e) {
            log.error("Error caching user conversations: {}", userId, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<ConversationRequest> getCachedUserConversations(Long userId) {
        try {
            String key = String.format(USER_CONVERSATIONS_KEY, userId);
            List<ConversationRequest> conversations = (List<ConversationRequest>) redisService.get(key, List.class);
            return conversations != null ? conversations : List.of();
        } catch (Exception e) {
            log.error("Error getting cached user conversations: {}", userId, e);
            return List.of();
        }
    }

    @Override
    public void evictConversation(Long conversationId) {
        try {
            String key = String.format(CONVERSATION_KEY, conversationId);
            redisService.delete(key);
            log.debug("Evicted conversation cache: {}", conversationId);
        } catch (Exception e) {
            log.error("Error evicting conversation cache: {}", conversationId, e);
        }
    }

    @Override
    public void evictUserConversations(Long userId) {
        try {
            String key = String.format(USER_CONVERSATIONS_KEY, userId);
            redisService.delete(key);
            log.debug("Evicted user conversations cache: {}", userId);
        } catch (Exception e) {
            log.error("Error evicting user conversations cache: {}", userId, e);
        }
    }

    // Unread Count Caching
    @Override
    public void cacheUnreadCount(Long conversationId, Long userId, int count) {
        try {
            String key = String.format(UNREAD_COUNT_KEY, conversationId, userId);
            redisService.set(key, count, CONVERSATION_TTL);
            log.debug("Cached unread count: {} for conversation: {}, user: {}", count, conversationId, userId);
        } catch (Exception e) {
            log.error("Error caching unread count: {}", e.getMessage(), e);
        }
    }

    @Override
    public Optional<Integer> getCachedUnreadCount(Long conversationId, Long userId) {
        try {
            String key = String.format(UNREAD_COUNT_KEY, conversationId, userId);
            Integer count = redisService.get(key, Integer.class);
            return Optional.ofNullable(count);
        } catch (Exception e) {
            log.error("Error getting cached unread count: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    @Override
    public void evictUnreadCount(Long conversationId, Long userId) {
        try {
            String key = String.format(UNREAD_COUNT_KEY, conversationId, userId);
            redisService.delete(key);
        } catch (Exception e) {
            log.error("Error evicting unread count: {}", e.getMessage(), e);
        }
    }

    // Statistics Caching
    @Override
    public void cacheOnlineUsers(List<String> userEmails) {
        try {
            redisService.delete(ONLINE_USERS_KEY);
            if (!userEmails.isEmpty()) {
                redisService.sAdd(ONLINE_USERS_KEY, userEmails.toArray());
                redisService.expire(ONLINE_USERS_KEY, Duration.ofMinutes(5));
            }
            log.debug("Cached {} online users", userEmails.size());
        } catch (Exception e) {
            log.error("Error caching online users: {}", e.getMessage(), e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<String> getCachedOnlineUsers() {
        try {
            return (List<String>) redisService.sMembers(ONLINE_USERS_KEY).stream()
                    .map(Object::toString)
                    .toList();
        } catch (Exception e) {
            log.error("Error getting cached online users: {}", e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    public void addOnlineUser(String userEmail) {
        try {
            redisService.sAdd(ONLINE_USERS_KEY, userEmail);
            redisService.expire(ONLINE_USERS_KEY, Duration.ofMinutes(5));
        } catch (Exception e) {
            log.error("Error adding online user: {}", e.getMessage(), e);
        }
    }

    @Override
    public void removeOnlineUser(String userEmail) {
        try {
            redisService.sRemove(ONLINE_USERS_KEY, userEmail);
        } catch (Exception e) {
            log.error("Error removing online user: {}", e.getMessage(), e);
        }
    }

    // Generic Cache Operations
    @Override
    public <T> void cache(String key, T value, Duration ttl) {
        try {
            redisService.set(key, value, ttl);
            log.debug("Cached key: {} with TTL: {}", key, ttl);
        } catch (Exception e) {
            log.error("Error caching key: {}", key, e);
        }
    }

    @Override
    public <T> Optional<T> getFromCache(String key, Class<T> type) {
        try {
            T value = redisService.get(key, type);
            return Optional.ofNullable(value);
        } catch (Exception e) {
            log.error("Error getting from cache key: {}", key, e);
            return Optional.empty();
        }
    }

    @Override
    public void evict(String key) {
        try {
            redisService.delete(key);
            log.debug("Evicted cache key: {}", key);
        } catch (Exception e) {
            log.error("Error evicting cache key: {}", key, e);
        }
    }

    @Override
    public void evictPattern(String pattern) {
        try {
            redisService.deletePattern(pattern);
            log.debug("Evicted cache pattern: {}", pattern);
        } catch (Exception e) {
            log.error("Error evicting cache pattern: {}", pattern, e);
        }
    }
}
