package personal.social.shared.infrastructure.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import personal.social.config.JwtTokenProvider;

@RequiredArgsConstructor
@Component
public class TokenUtil {
    private final JwtTokenProvider jwtUtil;

    public String extractAndValidateToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7); // get token without "Bearer "
        } else {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        if(!jwtUtil.validateToken(token)){
            throw new JwtException("Token is expired");
        }

        return jwtUtil.extractEmail(token);
    }
}
