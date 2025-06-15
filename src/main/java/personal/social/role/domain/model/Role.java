//package personal.social.role.domain.model;
//
//import lombok.Getter;
//import personal.social.role.domain.model.vo.RoleId;
//
//import java.util.Set;
//
//@Getter
//public class Role {
//    private RoleId parentRoleId;  // For hierarchy
//    private String name;
//    private String description;
//
//    private Set<Permission> permissions;
//    private boolean isSystem;     // true = không được xóa (ADMIN, USER)
//    private boolean isActive;     // false = không assign được nữa
//
//    // Business methods
//    public Set<Permission> getAllPermissions() {
//        // Lấy permissions của role + parent roles (recursive)
//        return null; // Placeholder for actual implementation
//    }
//
//
//    public static Role create(String name, String description) {
//        return new Role(RoleId.generate(), name, description);
//    }
//
//    @Override
//    public boolean equals(Object o) {
//        if (this == o) return true;
//        if (o == null || getClass() != o.getClass()) return false;
//        Role role = (Role) o;
//        return id.equals(role.id);
//    }
//
//    @Override
//    public int hashCode() {
//        return id.hashCode();
//    }
//}
