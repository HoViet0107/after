package personal.social.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Users implements UserDetails {
    /**
     * Unique identifier for the user.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User's unique email address.
     */
    @Column(columnDefinition = "VARCHAR(155)", unique = true, nullable = false)
    private String email;

    /**
     * User's hashed password. Excluded from JSON serialization for security.
     */
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    /**
     * User's first name.
     */
    @Column(name = "first_name", columnDefinition = "NVARCHAR(255)", nullable = false)
    private String firstName;

    /**
     * User's optional middle name or surname.
     */
    @Column(columnDefinition = "NVARCHAR(255)")
    private String surname;

    /**
     * User's last name.
     */
    @Column(name = "last_name", columnDefinition = "NVARCHAR(255)", nullable = false)
    private String lastName;

    /**
     * User's avatar url.
     */
    @Column(columnDefinition = "TEXT")
    private String avatarUrl;

    /**
     * User's latest active time.
     */
    @Column(name = "last_active")
    private LocalDateTime lastActive;

    /**
     * User's unique phone number. Optional.
     */
    @Column(columnDefinition = "VARCHAR(12)", unique = true)
    private String phone;

    /**
     * User's date of birth.
     */
    @Column(nullable = false)
    private LocalDate dob;

    /**
     * The date and time when the user account was created.
     */
    @Column(name = "created_at", columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "is_online", nullable = false, columnDefinition = "boolean default false")
    private boolean online;

    /**
     * The role associated with this user (e.g., ADMIN, USER).
     */
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Roles roles;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(roles);
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
//    private Roles roles;
}