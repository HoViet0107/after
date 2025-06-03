package personal.social.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.security.core.GrantedAuthority;

import java.security.Key;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import io.jsonwebtoken.security.Keys;
import personal.social.enums.RoleEnum;
import personal.social.model.Users;

@Component
@Slf4j
public class JwtTokenProvider {
    private final String SECRET_KEY = "z0UPwGEn0XiT35ZIQwq1vtGjMwdU6Zpd";
    private final long EXPIRATION_TIME = 86400000; // 1 day

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpirationInMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String email, List<RoleEnum> authorityStrings) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .claim("authorities", authorityStrings)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generates a JWT token containing the user's email and authorities.
     * <p>
     * The generated token is a compact, URL-safe means of representing claims
     * to be transferred between two parties. The token is digitally signed and
     * contains the user's username and authorities.
     * <p>
     * The token is valid for the configured expiration period.
     *
     * @param authentication The authenticated user
     * @return The generated JWT token
     */
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("roles", authorities)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    /**
     * Extracts the user's ID from the JWT token.
     * <p>
     * The user's ID is extracted from the subject claim of the JWT token.
     *
     * @param token The JWT token containing the user's ID
     * @return The user's ID
     */
    public String getUserEmailFromJWT(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();

        // The user's ID is stored in the subject claim
        return claims.getSubject();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Converts a JWT token to an {@link Authentication} object.
     * <p>
     * This method takes a JWT token, extracts the user's ID and authorities from it,
     * and returns an {@link Authentication} object containing the user's
     * information and the token.
     *
     * @param token The JWT token to convert
     * @return An {@link Authentication} object containing the user's information
     * and the token
     */
    public Authentication getAuthentication(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();

        String email = claims.getSubject();

        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(claims.get("roles").toString().split(","))
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        UserDetails principal = new Users(email, "", authorities);

        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    /**
     * Validates a JWT token against a secret key.
     * <p>
     * This method takes a JWT token and verifies that it is valid according to the
     * following criteria:
     * <ul>
     * <li>The token is not malformed</li>
     * <li>The token is not expired</li>
     * <li>The token is signed with the correct secret key</li>
     * <li>The token is supported (i.e., it is not an unsupported algorithm)</li>
     * <li>The token is not empty</li>
     * </ul>
     * <p>
     * If the token is invalid for any reason, this method will return false.
     *
     * @param authToken The JWT token to be validated
     * @return true if the token is valid, false if it is not
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
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
            log.error("JWT claims string is empty.");
        }
        return false;
    }

    public boolean isTokenExpired(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration()
                .before(new Date());
    }
}
