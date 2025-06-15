//package personal.social.role.application.service;
//
//public class SecurityService {
//    public boolean hasPermission(UserId userId, String permission) {
//        // 1. Get active role assignments
//        List<RoleAssignment> assignments = roleAssignmentRepository
//                .findActiveByUserId(userId, LocalDateTime.now());
//
//        if (assignments.isEmpty()) {
//            return false;
//        }
//
//        // 2. Get all roles
//        Set<RoleId> roleIds = assignments.stream()
//                .map(RoleAssignment::getRoleId)
//                .collect(Collectors.toSet());
//
//        List<Role> roles = roleRepository.findAllById(roleIds);
//
//        // 3. Collect all permissions (including from parent roles)
//        Set<String> allPermissions = roles.stream()
//                .flatMap(role -> role.getAllPermissions().stream())
//                .map(Permission::getCode)
//                .collect(Collectors.toSet());
//
//        // 4. Check permission
//        return allPermissions.contains(permission);
//    }
//
//    // Advanced permission check với context
//    public boolean canPerform(UserId userId, String action, Object resource) {
//        // Basic permission check
//        if (!hasPermission(userId, action)) {
//            return false;
//        }
//
//        // Context-based checks
//        switch (action) {
//            case "post:delete":
//                Post post = (Post) resource;
//                // Check if user is owner or has override permission
//                return post.getAuthorId().equals(userId) ||
//                        hasPermission(userId, "post:delete:any");
//
//            case "user:ban":
//                User targetUser = (User) resource;
//                // Cannot ban admin users
//                return !targetUser.hasRole("ADMIN");
//
//            default:
//                return true;
//        }
//    }
//}
