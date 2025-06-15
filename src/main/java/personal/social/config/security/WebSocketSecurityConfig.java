package personal.social.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@EnableWebSocketSecurity
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager() {
        MessageMatcherDelegatingAuthorizationManager.Builder messages =
                MessageMatcherDelegatingAuthorizationManager.builder();

        messages
                // Allow connection attempts
                .simpDestMatchers("/app/auth/**").permitAll()

                // Require authentication for chat operations
                .simpDestMatchers("/app/chat/**").authenticated()
                .simpDestMatchers("/app/typing/**").authenticated()
                .simpDestMatchers("/app/presence/**").authenticated()

                // Subscribe destinations
                .simpSubscribeDestMatchers("/topic/public").permitAll()
                .simpSubscribeDestMatchers("/topic/conversation/**").authenticated()
                .simpSubscribeDestMatchers("/topic/presence").authenticated()
                .simpSubscribeDestMatchers("/user/**").authenticated()

                // Default deny
                .anyMessage().denyAll();

        return messages.build();
    }
}