package personal.social.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import personal.social.enums.RoleEnum;
import personal.social.model.Users;
import personal.social.services.RedisService;

import java.security.Key;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.security.jwt-secret}")
    private String jwtSecret;

    @Value("${app.security.jwt-expiration-hours:24}")
    private int jwtExpirationHours;

    private final RedisService redisService;
    private Key signingKey;

    private static final String BLACKLIST_KEY_PREFIX = "jwt:blacklist:";


    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String email, List<RoleEnum> authorities) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + Duration.ofHours(jwtExpirationHours).toMillis());

        String authoritiesStr = authorities.stream()
                .map(Enum::name)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .setSubject(email)
                .claim("authorities", authoritiesStr)
                .claim("iat", now)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String generateRefreshToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + Duration.ofDays(7).toMillis()); // 7 days for refresh

        return Jwts.builder()
                .setSubject(email)
                .claim("type", "refresh")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUserEmailFromJWT(String token) {
        if (isTokenBlacklisted(token)) {
            throw new JwtException("Token has been revoked");
        }

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public Authentication getAuthentication(String token) {
        if (isTokenBlacklisted(token)) {
            throw new JwtException("Token has been revoked");
        }

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String email = claims.getSubject();
        String authoritiesStr = claims.get("authorities", String.class);

        Collection<SimpleGrantedAuthority> authorities = Arrays.stream(authoritiesStr.split(","))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        Users principal = new Users(email, "", authorities);
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    public boolean validateToken(String authToken) {
        try {
            if (isTokenBlacklisted(authToken)) {
                log.warn("Attempted to use blacklisted token");
                return false;
            }

            Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }

    public void blacklistToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Date expiration = claims.getExpiration();
            long ttl = expiration.getTime() - System.currentTimeMillis();

            if (ttl > 0) {
                String tokenId = generateTokenId(token);
                redisService.set(BLACKLIST_KEY_PREFIX + tokenId, "blacklisted", Duration.ofMillis(ttl));
                log.info("Token blacklisted successfully");
            }
        } catch (Exception e) {
            log.error("Error blacklisting token: {}", e.getMessage());
        }
    }

    private boolean isTokenBlacklisted(String token) {
        try {
            String tokenId = generateTokenId(token);
            return redisService.exists(BLACKLIST_KEY_PREFIX + tokenId);
        } catch (Exception e) {
            log.error("Error checking token blacklist: {}", e.getMessage());
            return false; // Fail open
        }
    }

    private String generateTokenId(String token) {
        return String.valueOf(token.hashCode());
    }

    public long getTokenExpirationTime(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getExpiration().getTime();
        } catch (Exception e) {
            return 0;
        }
    }
}
