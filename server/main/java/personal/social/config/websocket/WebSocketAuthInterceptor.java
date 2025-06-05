package personal.social.config.websocket;

import personal.social.config.JwtTokenProvider;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    public WebSocketAuthInterceptor(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authToken = accessor.getFirstNativeHeader("Authorization");

            if (authToken != null && authToken.startsWith("Bearer ")) {
                try {
                    String token = authToken.substring(7);

                    if (jwtTokenProvider.validateToken(token)) {
                        String userEmail = jwtTokenProvider.extractEmail(token);

                        // Create authentication object
                        Authentication auth = new UsernamePasswordAuthenticationToken(
                                userEmail, null, java.util.Collections.emptyList()
                        );

                        accessor.setUser(auth);
                        SecurityContextHolder.getContext().setAuthentication(auth);

                        // Store user info in session attributes
                        accessor.getSessionAttributes().put("userEmail", userEmail);
                        accessor.getSessionAttributes().put("authenticated", true);
                    }
                } catch (Exception e) {
                    System.err.println("WebSocket authentication failed: " + e.getMessage());
                    // Don't throw exception, let it connect as anonymous
                }
            }
        }

        return message;
    }

    @Override
    public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            String userEmail = (String) accessor.getSessionAttributes().get("userEmail");
            if (userEmail != null) {
                // Handle user disconnection
                handleUserDisconnect(userEmail, accessor.getSessionId());
            }
        }
    }

    private void handleUserDisconnect(String userEmail, String sessionId) {
        // Implement cleanup logic
        System.out.println("User disconnected: " + userEmail + ", Session: " + sessionId);
    }
}
