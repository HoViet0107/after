package personal.social.auth.domain.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionToken implements Serializable {
    private String accessToken;
    private String refreshToken;
    private String sessionId;
    private Long expiresIn;
}