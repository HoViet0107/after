//package personal.social.role.domain.model;
//
//// Permission.java
//public class Permission {
//    private PermissionId id;
//    private String code;        // "post:delete"
//    private String resource;    // "post"
//    private String action;      // "delete"
//    private String description;
//}
//
//// Lý do: Tách resource và action để dễ quản lý và filter
//// VD: Lấy tất cả permissions của "post" → WHERE resource = 'post'