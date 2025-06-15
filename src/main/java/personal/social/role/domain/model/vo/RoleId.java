//package personal.social.role.domain.model.vo;
//
//import java.util.UUID;
//
//public record RoleId(String value) {
//    public RoleId {
//        if (value == null || value.isBlank()) {
//            throw new IllegalArgumentException("Role ID must be positive");
//        }
//    }
//
//    public static RoleId of(String value) {
//        return new RoleId(value);
//    }
//
//    public static RoleId generate() {
//        return new RoleId(UUID.randomUUID().toString());
//    }
//}