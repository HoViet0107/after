<!-- Component tạo nhóm chat với WebSocket real-time và tính năng nâng cao -->

<template>
    <div class="group-conversation-create">
        <!-- Modal for creating group conversation -->
        <div class="modal fade" tabindex="-1" ref="modal" @hidden.bs.modal="handleModalHidden">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2"></i>
                            Tạo nhóm chat mới
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body">
                        <!-- Progress Steps -->
                        <div class="creation-steps mb-4">
                            <div class="steps-indicator">
                                <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
                                    <div class="step-number">1</div>
                                    <div class="step-label">Thông tin nhóm</div>
                                </div>
                                <div class="step-line" :class="{ active: currentStep > 1 }"></div>
                                <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
                                    <div class="step-number">2</div>
                                    <div class="step-label">Thêm thành viên</div>
                                </div>
                                <div class="step-line" :class="{ active: currentStep > 2 }"></div>
                                <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
                                    <div class="step-number">3</div>
                                    <div class="step-label">Cài đặt nhóm</div>
                                </div>
                                <div class="step-line" :class="{ active: currentStep > 3 }"></div>
                                <div class="step" :class="{ active: currentStep >= 4 }">
                                    <div class="step-number">4</div>
                                    <div class="step-label">Xác nhận</div>
                                </div>
                            </div>
                        </div>

                        <!-- Step Content -->
                        <div class="step-content">
                            <!-- Step 1: Group Information -->
                            <div v-if="currentStep === 1" class="step-panel">
                                <div class="step-header">
                                    <h6>Thông tin cơ bản về nhóm</h6>
                                    <p class="text-muted">Đặt tên và mô tả cho nhóm chat của bạn</p>
                                </div>

                                <div class="row">
                                    <!-- Group Avatar Upload -->
                                    <div class="col-md-4">
                                        <div class="group-avatar-section text-center">
                                            <div class="avatar-upload-container">
                                                <div class="group-avatar-preview">
                                                    <img :src="groupInfo.avatar || '/default-group-avatar.png'"
                                                        alt="Group Avatar" class="group-avatar-img" />
                                                    <div class="avatar-overlay" @click="triggerAvatarUpload">
                                                        <i class="fas fa-camera"></i>
                                                        <div class="overlay-text">Thay đổi</div>
                                                    </div>
                                                </div>
                                                <input type="file" ref="avatarInput" accept="image/*"
                                                    @change="handleAvatarUpload" style="display: none" />
                                            </div>

                                            <div class="avatar-actions mt-2">
                                                <button type="button" class="btn btn-sm btn-outline-primary"
                                                    @click="triggerAvatarUpload" :disabled="isUploadingAvatar">
                                                    <span v-if="isUploadingAvatar"
                                                        class="spinner-border spinner-border-sm me-1"></span>
                                                    {{ isUploadingAvatar ? 'Đang tải...' : 'Chọn ảnh' }}
                                                </button>

                                                <button v-if="groupInfo.avatar" type="button"
                                                    class="btn btn-sm btn-outline-secondary ms-1" @click="removeAvatar">
                                                    Xóa
                                                </button>
                                            </div>

                                            <div class="avatar-presets mt-3">
                                                <p class="small text-muted mb-2">Hoặc chọn từ mẫu có sẵn:</p>
                                                <div class="preset-avatars">
                                                    <div v-for="preset in avatarPresets" :key="preset.id"
                                                        class="preset-avatar"
                                                        :class="{ selected: groupInfo.avatar === preset.url }"
                                                        @click="selectPresetAvatar(preset)">
                                                        <img :src="preset.url" :alt="preset.name" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Group Details -->
                                    <div class="col-md-8">
                                        <div class="group-details-form">
                                            <!-- Group Name -->
                                            <div class="mb-4">
                                                <label for="groupName" class="form-label">
                                                    Tên nhóm <span class="text-danger">*</span>
                                                </label>
                                                <input type="text" id="groupName" v-model="groupInfo.name"
                                                    class="form-control" :class="{ 'is-invalid': errors.name }"
                                                    placeholder="Nhập tên nhóm..." maxlength="100"
                                                    @blur="validateGroupName" @input="clearError('name')" />
                                                <div v-if="errors.name" class="invalid-feedback">
                                                    {{ errors.name }}
                                                </div>
                                                <div class="form-text">{{ groupInfo.name.length }}/100 ký tự</div>
                                            </div>

                                            <!-- Group Description -->
                                            <div class="mb-4">
                                                <label for="groupDescription" class="form-label">Mô tả nhóm</label>
                                                <textarea id="groupDescription" v-model="groupInfo.description"
                                                    class="form-control" rows="4"
                                                    placeholder="Mô tả về nhóm chat này..." maxlength="500"></textarea>
                                                <div class="form-text">{{ groupInfo.description.length }}/500 ký tự
                                                </div>
                                            </div>

                                            <!-- Group Type -->
                                            <div class="mb-4">
                                                <label class="form-label">Loại nhóm</label>
                                                <div class="group-type-options">
                                                    <div class="form-check">
                                                        <input type="radio" id="publicGroup" v-model="groupInfo.type"
                                                            value="public" class="form-check-input" />
                                                        <label for="publicGroup" class="form-check-label">
                                                            <div class="option-content">
                                                                <i class="fas fa-globe text-primary"></i>
                                                                <div>
                                                                    <strong>Công khai</strong>
                                                                    <div class="text-muted small">Mọi người có thể tìm
                                                                        thấy và tham gia</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    <div class="form-check">
                                                        <input type="radio" id="privateGroup" v-model="groupInfo.type"
                                                            value="private" class="form-check-input" />
                                                        <label for="privateGroup" class="form-check-label">
                                                            <div class="option-content">
                                                                <i class="fas fa-lock text-warning"></i>
                                                                <div>
                                                                    <strong>Riêng tư</strong>
                                                                    <div class="text-muted small">Chỉ thành viên được
                                                                        mời mới có thể tham gia</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    <div class="form-check">
                                                        <input type="radio" id="secretGroup" v-model="groupInfo.type"
                                                            value="secret" class="form-check-input" />
                                                        <label for="secretGroup" class="form-check-label">
                                                            <div class="option-content">
                                                                <i class="fas fa-user-secret text-danger"></i>
                                                                <div>
                                                                    <strong>Bí mật</strong>
                                                                    <div class="text-muted small">Hoàn toàn ẩn, chỉ
                                                                        thành viên mới biết</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Group Category -->
                                            <div class="mb-4">
                                                <label for="groupCategory" class="form-label">Danh mục</label>
                                                <select id="groupCategory" v-model="groupInfo.category"
                                                    class="form-select">
                                                    <option value="">Chọn danh mục</option>
                                                    <option value="work">Công việc</option>
                                                    <option value="family">Gia đình</option>
                                                    <option value="friends">Bạn bè</option>
                                                    <option value="hobby">Sở thích</option>
                                                    <option value="study">Học tập</option>
                                                    <option value="community">Cộng đồng</option>
                                                    <option value="other">Khác</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: Add Members -->
                            <div v-if="currentStep === 2" class="step-panel">
                                <div class="step-header">
                                    <h6>Thêm thành viên vào nhóm</h6>
                                    <p class="text-muted">Mời bạn bè tham gia nhóm chat</p>
                                </div>

                                <div class="row">
                                    <!-- Member Search & Selection -->
                                    <div class="col-md-8">
                                        <div class="member-search-section">
                                            <!-- Search Input -->
                                            <div class="search-container mb-3">
                                                <div class="input-group">
                                                    <span class="input-group-text">
                                                        <i class="fas fa-search"></i>
                                                    </span>
                                                    <input type="text" v-model="memberSearchQuery" class="form-control"
                                                        placeholder="Tìm kiếm bạn bè để thêm vào nhóm..."
                                                        @input="handleMemberSearch" />
                                                    <button type="button" class="btn btn-outline-secondary"
                                                        @click="showInviteByLink = true" title="Mời qua liên kết">
                                                        <i class="fas fa-link"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Search Results -->
                                            <div class="search-results">
                                                <div v-if="isSearchingMembers" class="search-loading">
                                                    <div class="d-flex align-items-center justify-content-center py-3">
                                                        <div class="spinner-border spinner-border-sm me-2"></div>
                                                        <span class="text-muted">Đang tìm kiếm...</span>
                                                    </div>
                                                </div>

                                                <div v-else-if="memberSearchResults.length > 0" class="search-items">
                                                    <div v-for="user in memberSearchResults" :key="user.id"
                                                        class="search-item" @click="toggleMemberSelection(user)">
                                                        <div class="user-info">
                                                            <img :src="user.avatar || '/default-avatar.png'"
                                                                :alt="user.name" class="user-avatar" />
                                                            <div class="user-details">
                                                                <div class="user-name">{{ user.name }}</div>
                                                                <div class="user-meta">
                                                                    @{{ user.username }}
                                                                    <span v-if="user.mutualFriends > 0"
                                                                        class="mutual-friends">
                                                                        • {{ user.mutualFriends }} bạn chung
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="selection-control">
                                                            <div class="form-check">
                                                                <input type="checkbox" :id="`member-${user.id}`"
                                                                    :checked="isSelectedMember(user.id)"
                                                                    class="form-check-input"
                                                                    @change="toggleMemberSelection(user)" />
                                                                <label :for="`member-${user.id}`"
                                                                    class="form-check-label"></label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div v-else-if="memberSearchQuery && !isSearchingMembers"
                                                    class="no-results">
                                                    <div class="text-center py-3">
                                                        <i class="fas fa-search text-muted fs-4 mb-2"></i>
                                                        <div class="text-muted">Không tìm thấy bạn bè nào</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Quick Add Suggestions -->
                                            <div v-if="!memberSearchQuery && suggestedMembers.length > 0"
                                                class="suggestions-section">
                                                <h6 class="suggestions-title">Gợi ý thêm</h6>
                                                <div class="suggestions-grid">
                                                    <div v-for="user in suggestedMembers" :key="user.id"
                                                        class="suggestion-item" @click="toggleMemberSelection(user)">
                                                        <img :src="user.avatar || '/default-avatar.png'"
                                                            :alt="user.name" />
                                                        <div class="suggestion-name">{{ user.name }}</div>
                                                        <div v-if="isSelectedMember(user.id)"
                                                            class="selected-indicator">
                                                            <i class="fas fa-check-circle text-success"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Selected Members -->
                                    <div class="col-md-4">
                                        <div class="selected-members-section">
                                            <h6 class="section-title">
                                                Đã chọn ({{ selectedMembers.length }})
                                                <span v-if="selectedMembers.length < 2" class="text-danger small">
                                                    - Cần ít nhất 2 thành viên
                                                </span>
                                            </h6>

                                            <div v-if="selectedMembers.length === 0" class="empty-selection">
                                                <div class="text-center py-4">
                                                    <i class="fas fa-user-plus text-muted fs-2 mb-2"></i>
                                                    <div class="text-muted">Chưa chọn thành viên nào</div>
                                                    <small class="text-muted">Tìm kiếm và chọn bạn bè để thêm vào
                                                        nhóm</small>
                                                </div>
                                            </div>

                                            <div v-else class="selected-list">
                                                <div v-for="member in selectedMembers" :key="member.id"
                                                    class="selected-member">
                                                    <img :src="member.avatar || '/default-avatar.png'"
                                                        :alt="member.name" class="member-avatar" />
                                                    <div class="member-info">
                                                        <div class="member-name">{{ member.name }}</div>
                                                        <div class="member-username">@{{ member.username }}</div>
                                                    </div>
                                                    <button type="button" class="btn-remove"
                                                        @click="removeMember(member.id)" title="Xóa khỏi danh sách">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Member Roles Assignment -->
                                            <div v-if="selectedMembers.length > 0" class="member-roles-section mt-3">
                                                <h6 class="section-title">Phân quyền thành viên</h6>
                                                <div class="role-assignment">
                                                    <div v-for="member in selectedMembers" :key="`role-${member.id}`"
                                                        class="role-item">
                                                        <div class="member-basic-info">
                                                            <img :src="member.avatar || '/default-avatar.png'"
                                                                :alt="member.name" />
                                                            <span class="member-name">{{ member.name }}</span>
                                                        </div>
                                                        <select v-model="memberRoles[member.id]"
                                                            class="form-select form-select-sm">
                                                            <option value="member">Thành viên</option>
                                                            <option value="admin">Quản trị viên</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Invite by Link Modal -->
                                <div v-if="showInviteByLink" class="invite-link-section mt-4">
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Mời qua liên kết</h6>
                                            <button type="button" class="btn-close"
                                                @click="showInviteByLink = false"></button>
                                        </div>
                                        <div class="card-body">
                                            <p class="text-muted">Tạo liên kết mời để chia sẻ với bạn bè</p>
                                            <div class="input-group">
                                                <input type="text" :value="inviteLink" class="form-control" readonly />
                                                <button type="button" class="btn btn-outline-primary"
                                                    @click="copyInviteLink">
                                                    <i class="fas fa-copy"></i> Sao chép
                                                </button>
                                                <button type="button" class="btn btn-primary" @click="shareInviteLink">
                                                    <i class="fas fa-share"></i> Chia sẻ
                                                </button>
                                            </div>
                                            <div class="mt-2">
                                                <small class="text-muted">
                                                    Liên kết này có hiệu lực trong 7 ngày và có thể được sử dụng tối đa
                                                    50 lần
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Group Settings -->
                            <div v-if="currentStep === 3" class="step-panel">
                                <div class="step-header">
                                    <h6>Cài đặt nhóm</h6>
                                    <p class="text-muted">Tùy chỉnh quyền và tính năng cho nhóm</p>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="settings-section">
                                            <h6 class="settings-title">Quyền thành viên</h6>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Ai có thể thêm thành viên</label>
                                                    <small class="text-muted">Kiểm soát quyền mời thành viên mới</small>
                                                </div>
                                                <select v-model="groupSettings.whoCanAddMembers" class="form-select">
                                                    <option value="admins">Chỉ quản trị viên</option>
                                                    <option value="all">Tất cả thành viên</option>
                                                </select>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Ai có thể chỉnh sửa thông tin
                                                        nhóm</label>
                                                    <small class="text-muted">Kiểm soát quyền thay đổi tên, mô tả
                                                        nhóm</small>
                                                </div>
                                                <select v-model="groupSettings.whoCanEditInfo" class="form-select">
                                                    <option value="admins">Chỉ quản trị viên</option>
                                                    <option value="all">Tất cả thành viên</option>
                                                </select>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Phê duyệt thành viên mới</label>
                                                    <small class="text-muted">Yêu cầu phê duyệt khi có người tham
                                                        gia</small>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="groupSettings.requireApproval"
                                                        class="form-check-input" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="settings-section">
                                            <h6 class="settings-title">Kiểm duyệt nội dung</h6>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Lọc từ khóa</label>
                                                    <small class="text-muted">Tự động lọc tin nhắn chứa từ không phù
                                                        hợp</small>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="groupSettings.enableWordFilter"
                                                        class="form-check-input" />
                                                </div>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Hạn chế liên kết</label>
                                                    <small class="text-muted">Ngăn không cho gửi liên kết trong
                                                        nhóm</small>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="groupSettings.restrictLinks"
                                                        class="form-check-input" />
                                                </div>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Tin nhắn chào mừng</label>
                                                    <small class="text-muted">Tự động gửi tin nhắn chào mừng thành viên
                                                        mới</small>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="groupSettings.enableWelcomeMessage"
                                                        class="form-check-input" />
                                                </div>
                                            </div>

                                            <div v-if="groupSettings.enableWelcomeMessage"
                                                class="welcome-message-config">
                                                <textarea v-model="groupSettings.welcomeMessage" class="form-control"
                                                    rows="3"
                                                    placeholder="Chào mừng {{name}} đã tham gia nhóm!"></textarea>
                                                <small class="text-muted">Sử dụng {{ name }} để hiển thị tên thành
                                                    viên</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Advanced Settings -->
                                <div class="advanced-settings mt-4">
                                    <h6 class="settings-title">Cài đặt nâng cao</h6>

                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Giới hạn thành viên</label>
                                                    <small class="text-muted">Số lượng thành viên tối đa</small>
                                                </div>
                                                <select v-model="groupSettings.memberLimit" class="form-select">
                                                    <option value="50">50 thành viên</option>
                                                    <option value="100">100 thành viên</option>
                                                    <option value="250">250 thành viên</option>
                                                    <option value="500">500 thành viên</option>
                                                    <option value="1000">1000 thành viên</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="col-md-4">
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Tự động xóa tin nhắn</label>
                                                    <small class="text-muted">Xóa tin nhắn sau khoảng thời gian</small>
                                                </div>
                                                <select v-model="groupSettings.autoDeleteMessages" class="form-select">
                                                    <option value="0">Không bao giờ</option>
                                                    <option value="24">24 giờ</option>
                                                    <option value="168">1 tuần</option>
                                                    <option value="720">1 tháng</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="col-md-4">
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Múi giờ nhóm</label>
                                                    <small class="text-muted">Múi giờ chính của nhóm</small>
                                                </div>
                                                <select v-model="groupSettings.timezone" class="form-select">
                                                    <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                                                    <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                                                    <option value="Asia/Singapore">Singapore (UTC+8)</option>
                                                    <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                                                    <option value="UTC">UTC (UTC+0)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 4: Confirmation -->
                            <div v-if="currentStep === 4" class="step-panel">
                                <div class="step-header">
                                    <h6>Xác nhận tạo nhóm</h6>
                                    <p class="text-muted">Kiểm tra lại thông tin trước khi tạo nhóm</p>
                                </div>

                                <div class="confirmation-content">
                                    <div class="row">
                                        <!-- Group Summary -->
                                        <div class="col-md-8">
                                            <div class="group-summary">
                                                <div class="summary-section">
                                                    <h6>Thông tin nhóm</h6>
                                                    <div class="summary-item">
                                                        <img :src="groupInfo.avatar || '/default-group-avatar.png'"
                                                            :alt="groupInfo.name" class="summary-avatar" />
                                                        <div class="summary-details">
                                                            <div class="summary-name">{{ groupInfo.name }}</div>
                                                            <div class="summary-meta">
                                                                <span class="group-type">{{
                                                                    getGroupTypeText(groupInfo.type) }}</span>
                                                                <span v-if="groupInfo.category" class="group-category">
                                                                    • {{ getCategoryText(groupInfo.category) }}
                                                                </span>
                                                            </div>
                                                            <div v-if="groupInfo.description"
                                                                class="summary-description">
                                                                {{ groupInfo.description }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="summary-section">
                                                    <h6>Thành viên ({{ selectedMembers.length + 1 }})</h6>
                                                    <div class="members-summary">
                                                        <!-- Creator (You) -->
                                                        <div class="member-summary">
                                                            <img :src="currentUser?.avatar || '/default-avatar.png'"
                                                                :alt="currentUser?.name" class="member-avatar" />
                                                            <div class="member-info">
                                                                <div class="member-name">{{ currentUser?.name }} (Bạn)
                                                                </div>
                                                                <div class="member-role">Chủ nhóm</div>
                                                            </div>
                                                        </div>

                                                        <!-- Selected Members -->
                                                        <div v-for="member in selectedMembers" :key="member.id"
                                                            class="member-summary">
                                                            <img :src="member.avatar || '/default-avatar.png'"
                                                                :alt="member.name" class="member-avatar" />
                                                            <div class="member-info">
                                                                <div class="member-name">{{ member.name }}</div>
                                                                <div class="member-role">{{
                                                                    getRoleText(memberRoles[member.id]) }}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="summary-section">
                                                    <h6>Cài đặt nhóm</h6>
                                                    <div class="settings-summary">
                                                        <div class="setting-summary-item">
                                                            <span class="setting-name">Thêm thành viên:</span>
                                                            <span class="setting-value">{{
                                                                getSettingText('whoCanAddMembers',
                                                                    groupSettings.whoCanAddMembers) }}</span>
                                                        </div>
                                                        <div class="setting-summary-item">
                                                            <span class="setting-name">Chỉnh sửa thông tin:</span>
                                                            <span class="setting-value">{{
                                                                getSettingText('whoCanEditInfo',
                                                                    groupSettings.whoCanEditInfo) }}</span>
                                                        </div>
                                                        <div class="setting-summary-item">
                                                            <span class="setting-name">Phê duyệt thành viên:</span>
                                                            <span class="setting-value">{{ groupSettings.requireApproval
                                                                ? 'Có' : 'Không' }}</span>
                                                        </div>
                                                        <div class="setting-summary-item">
                                                            <span class="setting-name">Giới hạn thành viên:</span>
                                                            <span class="setting-value">{{ groupSettings.memberLimit }}
                                                                người</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Creation Actions -->
                                        <div class="col-md-4">
                                            <div class="creation-actions">
                                                <div class="action-card">
                                                    <h6>Sẵn sàng tạo nhóm?</h6>
                                                    <p class="text-muted">
                                                        Sau khi tạo, bạn có thể thay đổi hầu hết các cài đặt này trong
                                                        phần quản lý nhóm.
                                                    </p>

                                                    <div class="action-options">
                                                        <div class="form-check mb-3">
                                                            <input type="checkbox" id="notifyMembers"
                                                                v-model="creationOptions.notifyMembers"
                                                                class="form-check-input" />
                                                            <label for="notifyMembers" class="form-check-label">
                                                                Thông báo cho thành viên khi nhóm được tạo
                                                            </label>
                                                        </div>

                                                        <div class="form-check mb-3">
                                                            <input type="checkbox" id="addToFavorites"
                                                                v-model="creationOptions.addToFavorites"
                                                                class="form-check-input" />
                                                            <label for="addToFavorites" class="form-check-label">
                                                                Thêm nhóm vào danh sách yêu thích
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div class="estimated-time">
                                                        <small class="text-muted">
                                                            <i class="fas fa-clock me-1"></i>
                                                            Thời gian tạo ước tính: 2-5 giây
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <button v-if="currentStep > 1" type="button" class="btn btn-secondary" @click="previousStep"
                            :disabled="isCreating">
                            <i class="fas fa-arrow-left me-2"></i>Quay lại
                        </button>

                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Hủy
                        </button>

                        <button v-if="currentStep < 4" type="button" class="btn btn-primary" @click="nextStep"
                            :disabled="!canProceedToNextStep">
                            Tiếp tục
                            <i class="fas fa-arrow-right ms-2"></i>
                        </button>

                        <button v-if="currentStep === 4" type="button" class="btn btn-success" @click="createGroup"
                            :disabled="isCreating">
                            <span v-if="isCreating" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-plus me-2"></i>
                            {{ isCreating ? 'Đang tạo nhóm...' : 'Tạo nhóm' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useUserStore } from '@/stores/user'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import { Modal } from 'bootstrap'

// Props
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    initialMembers: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits([
    'created',
    'close'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const userStore = useUserStore()
const cacheStore = useCacheStore()
const toast = useToast()

// Refs
const modal = ref(null)
const avatarInput = ref(null)

// State
const currentStep = ref(1)
const isCreating = ref(false)
const isUploadingAvatar = ref(false)
const isSearchingMembers = ref(false)
const showInviteByLink = ref(false)
const memberSearchQuery = ref('')
const memberSearchResults = ref([])
const suggestedMembers = ref([])
const selectedMembers = ref([...props.initialMembers])
const memberRoles = ref({})
const inviteLink = ref('')
const errors = ref({})

// Group Information
const groupInfo = ref({
    name: '',
    description: '',
    avatar: '',
    type: 'private',
    category: ''
})

// Group Settings
const groupSettings = ref({
    whoCanAddMembers: 'admins',
    whoCanEditInfo: 'admins',
    requireApproval: false,
    enableWordFilter: false,
    restrictLinks: false,
    enableWelcomeMessage: true,
    welcomeMessage: 'Chào mừng {{name}} đã tham gia nhóm!',
    memberLimit: 100,
    autoDeleteMessages: 0,
    timezone: 'Asia/Ho_Chi_Minh'
})

// Creation Options
const creationOptions = ref({
    notifyMembers: true,
    addToFavorites: false
})

// Avatar Presets
const avatarPresets = ref([
    { id: 1, name: 'Group 1', url: '/group-avatars/group-1.png' },
    { id: 2, name: 'Group 2', url: '/group-avatars/group-2.png' },
    { id: 3, name: 'Group 3', url: '/group-avatars/group-3.png' },
    { id: 4, name: 'Group 4', url: '/group-avatars/group-4.png' },
    { id: 5, name: 'Group 5', url: '/group-avatars/group-5.png' },
    { id: 6, name: 'Group 6', url: '/group-avatars/group-6.png' }
])

// Modal instance
let modalInstance = null

// Computed
const currentUser = computed(() => authStore.user)

const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
        case 1:
            return groupInfo.value.name.trim().length >= 3 && !errors.value.name
        case 2:
            return selectedMembers.value.length >= 2
        case 3:
            return true
        default:
            return false
    }
})

// Methods
const getGroupTypeText = (type) => {
    const types = {
        public: 'Công khai',
        private: 'Riêng tư',
        secret: 'Bí mật'
    }
    return types[type] || 'Riêng tư'
}

const getCategoryText = (category) => {
    const categories = {
        work: 'Công việc',
        family: 'Gia đình',
        friends: 'Bạn bè',
        hobby: 'Sở thích',
        study: 'Học tập',
        community: 'Cộng đồng',
        other: 'Khác'
    }
    return categories[category] || category
}

const getRoleText = (role) => {
    const roles = {
        admin: 'Quản trị viên',
        member: 'Thành viên'
    }
    return roles[role] || 'Thành viên'
}

const getSettingText = (setting, value) => {
    const settings = {
        whoCanAddMembers: {
            admins: 'Chỉ quản trị viên',
            all: 'Tất cả thành viên'
        },
        whoCanEditInfo: {
            admins: 'Chỉ quản trị viên',
            all: 'Tất cả thành viên'
        }
    }
    return settings[setting]?.[value] || value
}

const validateGroupName = () => {
    errors.value = {}

    if (!groupInfo.value.name.trim()) {
        errors.value.name = 'Tên nhóm không được để trống'
    } else if (groupInfo.value.name.trim().length < 3) {
        errors.value.name = 'Tên nhóm phải có ít nhất 3 ký tự'
    } else if (groupInfo.value.name.length > 100) {
        errors.value.name = 'Tên nhóm không được vượt quá 100 ký tự'
    }
}

const clearError = (field) => {
    if (errors.value[field]) {
        delete errors.value[field]
    }
}

const triggerAvatarUpload = () => {
    avatarInput.value?.click()
}

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
    }

    if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
    }

    isUploadingAvatar.value = true

    try {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await conversationStore.uploadGroupAvatar(formData)
        groupInfo.value.avatar = response.url

        toast.success('Tải ảnh đại diện thành công!')

    } catch (error) {
        console.error('Avatar upload error:', error)
        toast.error('Tải ảnh thất bại. Vui lòng thử lại.')
    } finally {
        isUploadingAvatar.value = false
    }
}

const selectPresetAvatar = (preset) => {
    groupInfo.value.avatar = preset.url
}

const removeAvatar = () => {
    groupInfo.value.avatar = ''
}

const handleMemberSearch = debounce(async () => {
    if (!memberSearchQuery.value.trim()) {
        memberSearchResults.value = []
        return
    }

    isSearchingMembers.value = true

    try {
        const response = await userStore.searchUsers({
            query: memberSearchQuery.value,
            limit: 20,
            onlyFriends: true,
            excludeIds: selectedMembers.value.map(m => m.id)
        })

        memberSearchResults.value = response.users || []

    } catch (error) {
        console.error('Search members error:', error)
        toast.error('Tìm kiếm thất bại')
    } finally {
        isSearchingMembers.value = false
    }
}, 300)

const loadSuggestedMembers = async () => {
    try {
        const response = await userStore.getSuggestedUsers({
            limit: 12,
            excludeIds: selectedMembers.value.map(m => m.id)
        })

        suggestedMembers.value = response.users || []

    } catch (error) {
        console.error('Load suggested members error:', error)
    }
}

const isSelectedMember = (userId) => {
    return selectedMembers.value.find(m => m.id === userId) !== undefined
}

const toggleMemberSelection = (user) => {
    const existingIndex = selectedMembers.value.findIndex(m => m.id === user.id)

    if (existingIndex !== -1) {
        selectedMembers.value.splice(existingIndex, 1)
        delete memberRoles.value[user.id]
    } else {
        selectedMembers.value.push(user)
        memberRoles.value[user.id] = 'member'
    }
}

const removeMember = (userId) => {
    const index = selectedMembers.value.findIndex(m => m.id === userId)
    if (index !== -1) {
        selectedMembers.value.splice(index, 1)
        delete memberRoles.value[userId]
    }
}

const generateInviteLink = () => {
    // Generate a temporary invite link
    const linkId = Math.random().toString(36).substring(2, 15)
    inviteLink.value = `${window.location.origin}/invite/${linkId}`
}

const copyInviteLink = async () => {
    try {
        await navigator.clipboard.writeText(inviteLink.value)
        toast.success('Đã sao chép liên kết mời!')
    } catch (error) {
        console.error('Copy error:', error)
        toast.error('Không thể sao chép liên kết')
    }
}

const shareInviteLink = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Mời tham gia nhóm ${groupInfo.value.name}`,
                text: `Bạn được mời tham gia nhóm chat "${groupInfo.value.name}"`,
                url: inviteLink.value
            })
        } catch (error) {
            console.error('Share error:', error)
        }
    } else {
        // Fallback to copy
        copyInviteLink()
    }
}

const nextStep = () => {
    if (!canProceedToNextStep.value) return

    if (currentStep.value === 1) {
        validateGroupName()
        if (Object.keys(errors.value).length > 0) return
    }

    currentStep.value++

    if (currentStep.value === 2 && suggestedMembers.value.length === 0) {
        loadSuggestedMembers()
    }

    if (currentStep.value === 2 && !inviteLink.value) {
        generateInviteLink()
    }
}

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const createGroup = async () => {
    if (isCreating.value) return

    isCreating.value = true

    try {
        const groupData = {
            name: groupInfo.value.name.trim(),
            description: groupInfo.value.description.trim(),
            avatar: groupInfo.value.avatar,
            type: groupInfo.value.type,
            category: groupInfo.value.category,
            members: selectedMembers.value.map(member => ({
                id: member.id,
                role: memberRoles.value[member.id] || 'member'
            })),
            settings: groupSettings.value,
            options: creationOptions.value
        }

        const conversation = await conversationStore.createGroupConversation(groupData)

        toast.success(`Nhóm "${groupInfo.value.name}" đã được tạo thành công!`)

        emit('created', conversation)
        closeModal()

        // Navigate to the new group
        router.push(`/chat/${conversation.id}`)

    } catch (error) {
        console.error('Create group error:', error)
        toast.error('Tạo nhóm thất bại. Vui lòng thử lại.')
    } finally {
        isCreating.value = false
    }
}

const resetForm = () => {
    currentStep.value = 1
    groupInfo.value = {
        name: '',
        description: '',
        avatar: '',
        type: 'private',
        category: ''
    }
    selectedMembers.value = [...props.initialMembers]
    memberRoles.value = {}
    memberSearchQuery.value = ''
    memberSearchResults.value = []
    showInviteByLink.value = false
    inviteLink.value = ''
    errors.value = {}

    // Reset member roles for initial members
    props.initialMembers.forEach(member => {
        memberRoles.value[member.id] = 'member'
    })
}

const showModal = () => {
    if (modalInstance) {
        modalInstance.show()
    }
}

const closeModal = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
}

const handleModalHidden = () => {
    resetForm()
    emit('close')
}

// Watchers
watch(() => props.show, (show) => {
    if (show) {
        showModal()
    } else {
        closeModal()
    }
})

watch(() => props.initialMembers, (members) => {
    selectedMembers.value = [...members]
    members.forEach(member => {
        memberRoles.value[member.id] = 'member'
    })
}, { deep: true })

// Lifecycle
onMounted(() => {
    // Initialize Bootstrap modal
    if (modal.value) {
        modalInstance = new Modal(modal.value, {
            backdrop: 'static',
            keyboard: false
        })
    }

    // Initialize member roles for initial members
    props.initialMembers.forEach(member => {
        memberRoles.value[member.id] = 'member'
    })

    // Show modal if initially requested
    if (props.show) {
        showModal()
    }
})

onUnmounted(() => {
    if (modalInstance) {
        modalInstance.dispose()
    }
})

// Expose methods
defineExpose({
    show: showModal,
    hide: closeModal
})
</script>

<style scoped>
.group-conversation-create {
    /* Modal styles handled by Bootstrap */
}

.creation-steps {
    margin-bottom: 2rem;
}

.steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: opacity 0.3s ease;
}

.step.active {
    opacity: 1;
}

.step.completed {
    opacity: 1;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bs-secondary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 0.5rem;
    transition: background-color 0.3s ease;
}

.step.active .step-number {
    background: var(--bs-primary);
}

.step.completed .step-number {
    background: var(--bs-success);
}

.step-label {
    font-size: 0.875rem;
    text-align: center;
    white-space: nowrap;
}

.step-line {
    width: 60px;
    height: 2px;
    background: var(--bs-border-color);
    transition: background-color 0.3s ease;
}

.step-line.active {
    background: var(--bs-primary);
}

.step-content {
    min-height: 400px;
}

.step-panel {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.step-header {
    text-align: center;
    margin-bottom: 2rem;
}

/* Group Avatar Section */
.group-avatar-section {
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    background-color: var(--bs-light);
}

.avatar-upload-container {
    position: relative;
    display: inline-block;
}

.group-avatar-preview {
    position: relative;
    cursor: pointer;
}

.group-avatar-img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--bs-white);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
}

.group-avatar-preview:hover .avatar-overlay {
    opacity: 1;
}

.overlay-text {
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

.preset-avatars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.preset-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
}

.preset-avatar.selected {
    border-color: var(--bs-primary);
}

.preset-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Group Type Options */
.group-type-options .form-check {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s ease;
}

.group-type-options .form-check:hover {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.group-type-options .form-check-input:checked + .form-check-label {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.option-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    cursor: pointer;
}

.option-content i {
    font-size: 1.5rem;
}

/* Member Search */
.search-results {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    background: white;
}

.search-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.search-item:last-child {
    border-bottom: none;
}

.search-item:hover {
    background-color: var(--bs-light);
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.75rem;
}

.user-details {
    flex: 1;
}

.user-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.user-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.mutual-friends {
    color: var(--bs-primary);
}

/* Suggestions */
.suggestions-section {
    margin-top: 2rem;
}

.suggestions-title {
    margin-bottom: 1rem;
    color: var(--bs-primary);
}

.suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
}

.suggestion-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.suggestion-item:hover {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.suggestion-item img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 0.5rem;
}

.suggestion-name {
    font-size: 0.875rem;
    text-align: center;
    font-weight: 500;
}

.selected-indicator {
    position: absolute;
    top: -5px;
    right: -5px;
    background: white;
    border-radius: 50%;
    padding: 2px;
}

/* Selected Members */
.selected-members-section {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: var(--bs-light);
    height: fit-content;
}

.section-title {
    margin-bottom: 1rem;
    color: var(--bs-primary);
    font-weight: 600;
}

.selected-list {
    max-height: 300px;
    overflow-y: auto;
}

.selected-member {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    background: white;
    border: 1px solid var(--bs-border-color-translucent);
}

.member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.5rem;
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-username {
    font-size: 0.75rem;
    color: var(--bs-secondary);
}

.btn-remove {
    background: none;
    border: none;
    color: var(--bs-danger);
    padding: 0.25rem;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.btn-remove:hover {
    background-color: var(--bs-danger);
    color: white;
}

/* Role Assignment */
.member-roles-section {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.role-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.member-basic-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.member-basic-info img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 0.5rem;
}

.member-basic-info .member-name {
    font-size: 0.875rem;
}

/* Settings */
.settings-section {
    margin-bottom: 2rem;
}

.settings-title {
    color: var(--bs-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
}

.setting-info {
    flex: 1;
}

.setting-label {
    font-weight: 500;
    margin-bottom: 0.25rem;
    display: block;
}

.welcome-message-config {
    margin-top: 0.5rem;
    padding: 1rem;
    background-color: var(--bs-light);
    border-radius: 0.375rem;
}

/* Confirmation */
.confirmation-content {
    margin-top: 1rem;
}

.group-summary {
    background: var(--bs-light);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

.summary-section {
    margin-bottom: 2rem;
}

.summary-section:last-child {
    margin-bottom: 0;
}

.summary-section h6 {
    color: var(--bs-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.summary-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.summary-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.summary-details {
    flex: 1;
}

.summary-name {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.summary-meta {
    color: var(--bs-secondary);
    margin-bottom: 0.5rem;
}

.summary-description {
    color: var(--bs-body-color);
    font-size: 0.95rem;
}

.members-summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.member-summary {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: 0.375rem;
    border: 1px solid var(--bs-border-color-translucent);
}

.member-summary .member-avatar {
    width: 40px;
    height: 40px;
    margin-right: 0.75rem;
}

.member-summary .member-info {
    flex: 1;
}

.member-summary .member-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.member-summary .member-role {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.settings-summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.setting-summary-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bs-border-color-translucent);
}

.setting-summary-item:last-child {
    border-bottom: none;
}

.setting-name {
    font-weight: 500;
}

.setting-value {
    color: var(--bs-secondary);
}

.creation-actions {
    position: sticky;
    top: 1rem;
}

.action-card {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

.action-card h6 {
    color: var(--bs-primary);
    margin-bottom: 1rem;
}

.action-options {
    margin: 1.5rem 0;
}

.estimated-time {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid var(--bs-border-color);
}

/* Responsive */
@media (max-width: 768px) {
    .steps-indicator {
        flex-direction: column;
        gap: 1rem;
    }

    .step {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
    }

    .step-line {
        width: 2px;
        height: 30px;
    }

    .step-number {
        width: 30px;
        height: 30px;
        margin-bottom: 0;
    }

    .step-label {
        white-space: normal;
    }

    .group-avatar-img {
        width: 80px;
        height: 80px;
    }

    .preset-avatars {
        grid-template-columns: repeat(6, 1fr);
    }

    .suggestions-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }

    .setting-item {
        flex-direction: column;
        align-items: stretch;
    }

    .summary-item {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .setting-summary-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
    }
}
</style>