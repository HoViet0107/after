package personal.social.config.socket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Custom WebSocket handshake handler that determines the user principal for WebSocket connections.
 * <p>
 * Extends Spring's DefaultHandshakeHandler to provide custom user identification logic.
 * If an authenticated principal exists in the request, it will be used. Otherwise,
 * an anonymous principal is created using the client's remote IP address as the identifier.
 * <p>
 * This handler ensures that all WebSocket connections have an associated principal,
 * enabling proper session management and message routing even for unauthenticated users.
 */
@Component
public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        Principal principal = request.getPrincipal();

        if (principal == null) {
            String remoteAddress = request.getRemoteAddress().getAddress().getHostAddress();
            principal = new AnonymousPrincipal(remoteAddress);
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
