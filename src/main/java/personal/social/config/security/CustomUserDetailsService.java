package personal.social.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.repository.UserRepository;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Users user = userRepository.findByEmail(Email.of(email))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail().value(),
                user.getPasswordHash(),
                user.isActive(),
                true,
                true,
                !user.getStatus().equals(personal.social.user.domain.model.enums.UserStatus.SUSPENDED),
                new ArrayList<>()
        );
    }
}
