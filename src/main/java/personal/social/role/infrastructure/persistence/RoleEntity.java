//package personal.social.user.infrastructure.persistence;
//
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.util.HashSet;
//import java.util.Set;
//
//@Entity
//@Table(name = "roles")
//@Getter
//@Setter
//@Builder
//@NoArgsConstructor
//@AllArgsConstructor
//public class RoleEntity {
//    @Id
//    @Column(name = "id", nullable = false, length = 36)
//    private String id;
//
//    @Column(name = "name", nullable = false, unique = true)
//    private String name;
//
//    @Column(name = "description")
//    private String description;
//
//    @ManyToMany(mappedBy = "roles")
//    private Set<UserEntity> users = new HashSet<>();
//}