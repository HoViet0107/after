package personal.social.config.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Component
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        // Check if user is already authenticated
        Principal principal = request.getPrincipal();

        if (principal == null) {
            // Create anonymous principal with unique session ID
            String sessionId = UUID.randomUUID().toString();
            principal = new AnonymousPrincipal(sessionId);
        }

        return principal;
    }

    private static class AnonymousPrincipal implements Principal {
        private final String name;

        AnonymousPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
