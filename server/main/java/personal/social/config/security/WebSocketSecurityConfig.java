package personal.social.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import javax.crypto.spec.SecretKeySpec;

@Configuration
@EnableWebSocketSecurity
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages) {

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

    @Bean
    public JwtDecoder jwtDecoder() {
        String secretKey = "z0UPwGEn0XiT35ZIQwq1vtGjMwdU6Zpd"; // Same as in JwtTokenProvider
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(keySpec).build();
    }
}
