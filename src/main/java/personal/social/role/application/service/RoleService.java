//package personal.social.role.application.service;
//
//import org.springframework.transaction.annotation.Transactional;
//import personal.social.user.domain.exception.UserNotFoundException;
//
//public class RoleService {
//    // RoleService.java
//    @Transactional
//    public void assignRole(AssignRoleRequest request) {
//        // 1. Security check
//        User admin = getCurrentUser();
//        if (!admin.hasPermission("role:assign")) {
//            throw new ForbiddenException("No permission to assign roles");
//        }
//
//        // 2. Load entities
//        User targetUser = userRepository.findById(request.getUserId())
//                .orElseThrow(() -> new UserNotFoundException("User not found"));
//        Role role = roleRepository.findById(request.getRoleId())
//                .orElseThrow(() -> new NotFoundException("Role not found"));
//
//        // 3. Validate user status
//        if (!targetUser.isActive()) {
//            throw new ValidationException("Cannot assign role to inactive user");
//        }
//
//        // 4. Check conflicts
//        checkRoleConflicts(targetUser, role);
//
//        // 5. Business rules
//        validateBusinessRules(targetUser, role);
//
//        // 6. Deactivate conflicting roles if needed
//        if (role.getName().equals("ADMIN")) {
//            deactivateRole(targetUser, "MODERATOR"); // Admin không cần role Mod
//        }
//
//        // 7. Create assignment
//        RoleAssignment assignment = RoleAssignment.builder()
//                .userId(targetUser.getId())
//                .roleId(role.getId())
//                .assignedBy(admin.getId())
//                .reason(request.getReason())
//                .validFrom(request.getValidFrom())
//                .validUntil(request.getValidUntil())
//                .build();
//
//        roleAssignmentRepository.save(assignment);
//
//        // 8. Notification
//        notificationService.notify(targetUser,
//                "You have been assigned " + role.getName() + " role");
//
//        // 9. Audit
//        auditService.log("ROLE_ASSIGNED",
//                Map.of("user", targetUser.getId(),
//                        "role", role.getName(),
//                        "by", admin.getId(),
//                        "reason", request.getReason()));
//    }
//}
