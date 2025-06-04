package personal.social.services;

import personal.social.dto.message.ChatMessageDTO;
import personal.social.dto.conversation.ConversationRequest;
import personal.social.model.Users;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

public interface CachingService {

    // User Caching
    void cacheUser(Users user);
    void cacheUser(Users user, Duration ttl);
    Optional<Users> getCachedUser(Long userId);
    Optional<Users> getCachedUserByEmail(String email);
    void evictUser(Long userId);
    void evictUserByEmail(String email);

    // Message Caching
    void cacheMessage(ChatMessageDTO message);
    void cacheMessages(List<ChatMessageDTO> messages, Long conversationId);
    Optional<ChatMessageDTO> getCachedMessage(Long messageId);

    /**
     * Retrieve a paginated list of cached chat messages for a specific conversation.
     *
     * @param conversationId the ID of the conversation to retrieve messages for
     * @param page the page number for pagination
     * @param size the number of messages per page
     * @return a list of chat messages for the specified conversation and page
     */
    List<ChatMessageDTO> getCachedMessages(Long conversationId, int page, int size);

    void evictMessage(Long messageId);
    void evictConversationMessages(Long conversationId);

    // Conversation Caching
    void cacheConversation(ConversationRequest conversation);
    Optional<ConversationRequest> getCachedConversation(Long conversationId);
    void cacheUserConversations(Long userId, List<ConversationRequest> conversations);
    List<ConversationRequest> getCachedUserConversations(Long userId);
    void evictConversation(Long conversationId);
    void evictUserConversations(Long userId);

    // Reaction Caching
    void cacheUnreadCount(Long conversationId, Long userId, int count);
    Optional<Integer> getCachedUnreadCount(Long conversationId, Long userId);
    void evictUnreadCount(Long conversationId, Long userId);

    // Statistics Caching
    void cacheOnlineUsers(List<String> userEmails);
    List<String> getCachedOnlineUsers();
    void addOnlineUser(String userEmail);
    void removeOnlineUser(String userEmail);

    // Generic Cache Operations
    <T> void cache(String key, T value, Duration ttl);
    <T> Optional<T> getFromCache(String key, Class<T> type);
    void evict(String key);
    void evictPattern(String pattern);
}
