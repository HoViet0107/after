<!-- Component cài đặt cuộc trò chuyện với Redis caching và WebSocket real-time sync -->

<template>
    <div class="conversation-settings">
        <!-- Modal for conversation settings -->
        <div class="modal fade" tabindex="-1" ref="modal" @hidden.bs.modal="handleModalHidden">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-cog me-2"></i>
                            Cài đặt {{ conversation?.isGroupChat ? 'nhóm' : 'cuộc trò chuyện' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body">
                        <div v-if="isLoading" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Đang tải...</span>
                            </div>
                            <div class="text-muted mt-2">Đang tải cài đặt...</div>
                        </div>

                        <div v-else class="settings-content">
                            <!-- Tabs Navigation -->
                            <ul class="nav nav-pills nav-justified mb-4" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" data-bs-toggle="pill"
                                        data-bs-target="#general-settings" type="button" role="tab">
                                        <i class="fas fa-sliders-h me-2"></i>
                                        Chung
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="pill"
                                        data-bs-target="#notification-settings" type="button" role="tab">
                                        <i class="fas fa-bell me-2"></i>
                                        Thông báo
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="pill" data-bs-target="#privacy-settings"
                                        type="button" role="tab">
                                        <i class="fas fa-shield-alt me-2"></i>
                                        Quyền riêng tư
                                    </button>
                                </li>
                                <li v-if="conversation?.isGroupChat" class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="pill" data-bs-target="#admin-settings"
                                        type="button" role="tab">
                                        <i class="fas fa-crown me-2"></i>
                                        Quản trị
                                    </button>
                                </li>
                            </ul>

                            <!-- Tab Content -->
                            <div class="tab-content">
                                <!-- General Settings -->
                                <div class="tab-pane fade show active" id="general-settings" role="tabpanel">
                                    <div class="settings-section">
                                        <h6 class="section-title">Hiển thị</h6>

                                        <!-- Theme -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Giao diện</label>
                                                <small class="text-muted">Chọn giao diện cho cuộc trò chuyện này</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="settings.theme" class="form-select"
                                                    @change="updateSettings">
                                                    <option value="auto">Theo hệ thống</option>
                                                    <option value="light">Sáng</option>
                                                    <option value="dark">Tối</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Message Font Size -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Kích thước chữ</label>
                                                <small class="text-muted">Điều chỉnh kích thước chữ tin nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="font-size-slider">
                                                    <input type="range" v-model="settings.fontSize" class="form-range"
                                                        min="12" max="20" step="1" @input="updateSettings" />
                                                    <div class="font-size-preview"
                                                        :style="{ fontSize: settings.fontSize + 'px' }">
                                                        Aa
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Compact Mode -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Chế độ gọn</label>
                                                <small class="text-muted">Hiển thị tin nhắn dạng gọn để tiết kiệm không
                                                    gian</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.compactMode"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Show Avatars -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Hiển thị avatar</label>
                                                <small class="text-muted">Hiển thị ảnh đại diện bên cạnh tin
                                                    nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.showAvatars"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Show Timestamps -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Hiển thị thời gian</label>
                                                <small class="text-muted">Hiển thị thời gian gửi tin nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="settings.timestampDisplay" class="form-select"
                                                    @change="updateSettings">
                                                    <option value="hover">Khi di chuột</option>
                                                    <option value="always">Luôn hiển thị</option>
                                                    <option value="never">Không hiển thị</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="settings-section">
                                        <h6 class="section-title">Tương tác</h6>

                                        <!-- Auto Scroll -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Tự động cuộn</label>
                                                <small class="text-muted">Tự động cuộn xuống tin nhắn mới</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.autoScroll"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Enter to Send -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Enter để gửi</label>
                                                <small class="text-muted">Nhấn Enter để gửi tin nhắn (Shift+Enter để
                                                    xuống dòng)</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.enterToSend"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Show Typing Indicators -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Hiển thị đang gõ</label>
                                                <small class="text-muted">Hiển thị khi người khác đang gõ tin
                                                    nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.showTypingIndicators"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Read Receipts -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Xác nhận đã đọc</label>
                                                <small class="text-muted">Gửi xác nhận khi đã đọc tin nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="settings.sendReadReceipts"
                                                        class="form-check-input" @change="updateSettings" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Storage Settings -->
                                    <div class="settings-section">
                                        <h6 class="section-title">Lưu trữ</h6>

                                        <!-- Auto Download Media -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Tự động tải media</label>
                                                <small class="text-muted">Tự động tải hình ảnh và video</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="settings.autoDownloadMedia" class="form-select"
                                                    @change="updateSettings">
                                                    <option value="always">Luôn luôn</option>
                                                    <option value="wifi">Chỉ khi dùng WiFi</option>
                                                    <option value="never">Không bao giờ</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Cache Duration -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Thời gian lưu cache</label>
                                                <small class="text-muted">Thời gian lưu trữ tin nhắn trong bộ
                                                    nhớ</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="settings.cacheDuration" class="form-select"
                                                    @change="updateSettings">
                                                    <option value="1">1 ngày</option>
                                                    <option value="7">1 tuần</option>
                                                    <option value="30">1 tháng</option>
                                                    <option value="90">3 tháng</option>
                                                    <option value="0">Không giới hạn</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Storage Usage -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Dung lượng sử dụng</label>
                                                <small class="text-muted">{{ formatStorageSize(storageUsage.total) }}
                                                    được sử dụng</small>
                                            </div>
                                            <div class="setting-control">
                                                <button type="button" class="btn btn-outline-secondary btn-sm"
                                                    @click="clearCache" :disabled="isClearingCache">
                                                    <span v-if="isClearingCache"
                                                        class="spinner-border spinner-border-sm me-1"></span>
                                                    {{ isClearingCache ? 'Đang xóa...' : 'Xóa cache' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Notification Settings -->
                                <div class="tab-pane fade" id="notification-settings" role="tabpanel">
                                    <div class="settings-section">
                                        <h6 class="section-title">Thông báo tin nhắn</h6>

                                        <!-- Enable Notifications -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Bật thông báo</label>
                                                <small class="text-muted">Nhận thông báo cho cuộc trò chuyện này</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="notificationSettings.enabled"
                                                        class="form-check-input" @change="updateNotificationSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Notification Types -->
                                        <div v-if="notificationSettings.enabled" class="notification-types">
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Loại thông báo</label>
                                                    <small class="text-muted">Chọn loại tin nhắn sẽ gửi thông
                                                        báo</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="notification-options">
                                                        <div class="form-check">
                                                            <input type="checkbox"
                                                                v-model="notificationSettings.allMessages"
                                                                class="form-check-input"
                                                                @change="updateNotificationSettings" />
                                                            <label class="form-check-label">Tất cả tin nhắn</label>
                                                        </div>
                                                        <div v-if="conversation?.isGroupChat" class="form-check">
                                                            <input type="checkbox"
                                                                v-model="notificationSettings.mentionsOnly"
                                                                class="form-check-input"
                                                                @change="updateNotificationSettings" />
                                                            <label class="form-check-label">Chỉ khi được mention</label>
                                                        </div>
                                                        <div class="form-check">
                                                            <input type="checkbox"
                                                                v-model="notificationSettings.importantOnly"
                                                                class="form-check-input"
                                                                @change="updateNotificationSettings" />
                                                            <label class="form-check-label">Chỉ tin nhắn quan
                                                                trọng</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Sound Settings -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Âm thanh thông báo</label>
                                                    <small class="text-muted">Phát âm thanh khi có thông báo</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="sound-settings">
                                                        <div class="form-check form-switch mb-2">
                                                            <input type="checkbox"
                                                                v-model="notificationSettings.soundEnabled"
                                                                class="form-check-input"
                                                                @change="updateNotificationSettings" />
                                                            <label class="form-check-label">Bật âm thanh</label>
                                                        </div>

                                                        <div v-if="notificationSettings.soundEnabled"
                                                            class="sound-options">
                                                            <select v-model="notificationSettings.soundType"
                                                                class="form-select form-select-sm mb-2"
                                                                @change="updateNotificationSettings">
                                                                <option value="default">Mặc định</option>
                                                                <option value="gentle">Nhẹ nhàng</option>
                                                                <option value="alert">Cảnh báo</option>
                                                                <option value="chime">Chuông</option>
                                                            </select>

                                                            <div class="volume-control">
                                                                <label class="form-label">Âm lượng</label>
                                                                <input type="range"
                                                                    v-model="notificationSettings.volume"
                                                                    class="form-range" min="0" max="100"
                                                                    @input="updateNotificationSettings" />
                                                                <div class="volume-display">{{
                                                                    notificationSettings.volume }}%</div>
                                                            </div>

                                                            <button type="button" class="btn btn-sm btn-outline-primary"
                                                                @click="testNotificationSound">
                                                                <i class="fas fa-volume-up me-1"></i>Thử nghiệm
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Quiet Hours -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Giờ yên lặng</label>
                                                    <small class="text-muted">Tắt thông báo trong khoảng thời gian
                                                        này</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="quiet-hours">
                                                        <div class="form-check form-switch mb-2">
                                                            <input type="checkbox"
                                                                v-model="notificationSettings.quietHoursEnabled"
                                                                class="form-check-input"
                                                                @change="updateNotificationSettings" />
                                                            <label class="form-check-label">Bật giờ yên lặng</label>
                                                        </div>

                                                        <div v-if="notificationSettings.quietHoursEnabled"
                                                            class="time-range">
                                                            <div class="row g-2">
                                                                <div class="col-6">
                                                                    <label class="form-label">Từ</label>
                                                                    <input type="time"
                                                                        v-model="notificationSettings.quietStart"
                                                                        class="form-control"
                                                                        @change="updateNotificationSettings" />
                                                                </div>
                                                                <div class="col-6">
                                                                    <label class="form-label">Đến</label>
                                                                    <input type="time"
                                                                        v-model="notificationSettings.quietEnd"
                                                                        class="form-control"
                                                                        @change="updateNotificationSettings" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Privacy Settings -->
                                <div class="tab-pane fade" id="privacy-settings" role="tabpanel">
                                    <div class="settings-section">
                                        <h6 class="section-title">Quyền riêng tư</h6>

                                        <!-- Message History -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Lịch sử tin nhắn</label>
                                                <small class="text-muted">Ai có thể xem lịch sử tin nhắn</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="privacySettings.messageHistory" class="form-select"
                                                    @change="updatePrivacySettings">
                                                    <option value="all">Tất cả thành viên</option>
                                                    <option value="from_join">Từ khi tham gia</option>
                                                    <option value="none">Không ai</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Screenshot Protection -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Chống chụp màn hình</label>
                                                <small class="text-muted">Ngăn chặn chụp màn hình cuộc trò
                                                    chuyện</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox"
                                                        v-model="privacySettings.screenshotProtection"
                                                        class="form-check-input" @change="updatePrivacySettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Message Deletion -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Xóa tin nhắn tự động</label>
                                                <small class="text-muted">Tự động xóa tin nhắn sau khoảng thời
                                                    gian</small>
                                            </div>
                                            <div class="setting-control">
                                                <select v-model="privacySettings.autoDeleteDuration" class="form-select"
                                                    @change="updatePrivacySettings">
                                                    <option value="0">Không bao giờ</option>
                                                    <option value="24">24 giờ</option>
                                                    <option value="168">1 tuần</option>
                                                    <option value="720">1 tháng</option>
                                                    <option value="8760">1 năm</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Forward Prevention -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Ngăn chuyển tiếp</label>
                                                <small class="text-muted">Ngăn chuyển tiếp tin nhắn ra ngoài</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="privacySettings.preventForwarding"
                                                        class="form-check-input" @change="updatePrivacySettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Download Prevention -->
                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Ngăn tải xuống</label>
                                                <small class="text-muted">Ngăn tải xuống media và file</small>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="privacySettings.preventDownload"
                                                        class="form-check-input" @change="updatePrivacySettings" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Data Export -->
                                    <div class="settings-section">
                                        <h6 class="section-title">Dữ liệu</h6>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <label class="setting-label">Xuất dữ liệu</label>
                                                <small class="text-muted">Tải về bản sao tất cả tin nhắn và
                                                    media</small>
                                            </div>
                                            <div class="setting-control">
                                                <button type="button" class="btn btn-outline-primary btn-sm"
                                                    @click="exportConversationData" :disabled="isExporting">
                                                    <span v-if="isExporting"
                                                        class="spinner-border spinner-border-sm me-1"></span>
                                                    {{ isExporting ? 'Đang xuất...' : 'Xuất dữ liệu' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Admin Settings (Group only) -->
                                <div v-if="conversation?.isGroupChat" class="tab-pane fade" id="admin-settings"
                                    role="tabpanel">
                                    <div v-if="!canManageGroup" class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        Chỉ quản trị viên mới có thể truy cập cài đặt này.
                                    </div>

                                    <div v-else>
                                        <div class="settings-section">
                                            <h6 class="section-title">Quyền thành viên</h6>

                                            <!-- Who can add members -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Ai có thể thêm thành viên</label>
                                                    <small class="text-muted">Kiểm soát quyền mời thành viên mới</small>
                                                </div>
                                                <div class="setting-control">
                                                    <select v-model="adminSettings.whoCanAddMembers" class="form-select"
                                                        @change="updateAdminSettings">
                                                        <option value="owner">Chỉ chủ nhóm</option>
                                                        <option value="admins">Quản trị viên</option>
                                                        <option value="all">Tất cả thành viên</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <!-- Who can edit group info -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Ai có thể chỉnh sửa thông tin
                                                        nhóm</label>
                                                    <small class="text-muted">Kiểm soát quyền thay đổi tên, mô tả
                                                        nhóm</small>
                                                </div>
                                                <div class="setting-control">
                                                    <select v-model="adminSettings.whoCanEditInfo" class="form-select"
                                                        @change="updateAdminSettings">
                                                        <option value="owner">Chỉ chủ nhóm</option>
                                                        <option value="admins">Quản trị viên</option>
                                                        <option value="all">Tất cả thành viên</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <!-- Who can send messages -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Ai có thể gửi tin nhắn</label>
                                                    <small class="text-muted">Kiểm soát quyền gửi tin nhắn trong
                                                        nhóm</small>
                                                </div>
                                                <div class="setting-control">
                                                    <select v-model="adminSettings.whoCanSendMessages"
                                                        class="form-select" @change="updateAdminSettings">
                                                        <option value="all">Tất cả thành viên</option>
                                                        <option value="admins">Chỉ quản trị viên</option>
                                                        <option value="owner">Chỉ chủ nhóm</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="settings-section">
                                            <h6 class="section-title">Kiểm duyệt</h6>

                                            <!-- Message approval -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Phê duyệt tin nhắn</label>
                                                    <small class="text-muted">Tin nhắn cần được phê duyệt trước khi hiển
                                                        thị</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="form-check form-switch">
                                                        <input type="checkbox" v-model="adminSettings.messageApproval"
                                                            class="form-check-input" @change="updateAdminSettings" />
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Link preview restriction -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Hạn chế liên kết</label>
                                                    <small class="text-muted">Không cho phép gửi liên kết</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="form-check form-switch">
                                                        <input type="checkbox" v-model="adminSettings.restrictLinks"
                                                            class="form-check-input" @change="updateAdminSettings" />
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Word filter -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Lọc từ khóa</label>
                                                    <small class="text-muted">Tự động lọc tin nhắn chứa từ không phù
                                                        hợp</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="form-check form-switch">
                                                        <input type="checkbox" v-model="adminSettings.wordFilter"
                                                            class="form-check-input" @change="updateAdminSettings" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="settings-section">
                                            <h6 class="section-title">Tự động hóa</h6>

                                            <!-- Welcome message -->
                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <label class="setting-label">Tin nhắn chào mừng</label>
                                                    <small class="text-muted">Tự động gửi tin nhắn khi có thành viên
                                                        mới</small>
                                                </div>
                                                <div class="setting-control">
                                                    <div class="form-check form-switch">
                                                        <input type="checkbox"
                                                            v-model="adminSettings.welcomeMessage.enabled"
                                                            class="form-check-input" @change="updateAdminSettings" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div v-if="adminSettings.welcomeMessage.enabled"
                                                class="welcome-message-config ms-4">
                                                <textarea v-model="adminSettings.welcomeMessage.content"
                                                    class="form-control" rows="3"
                                                    placeholder="Chào mừng {{name}} đã tham gia nhóm!"
                                                    @blur="updateAdminSettings"></textarea>
                                                <small class="text-muted">
                                                    Sử dụng {{ name }} để hiển thị tên thành viên mới
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Đóng
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveAllSettings" :disabled="isSaving">
                            <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isSaving ? 'Đang lưu...' : 'Lưu tất cả' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { Modal } from 'bootstrap'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    conversation: {
        type: Object,
        default: null
    },
    show: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'close',
    'settings-updated'
])

// Dependencies
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const cacheStore = useCacheStore()
const toast = useToast()

// Refs
const modal = ref(null)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const isClearingCache = ref(false)
const isExporting = ref(false)
const storageUsage = ref({ total: 0, messages: 0, media: 0 })

// Settings objects
const settings = ref({
    theme: 'auto',
    fontSize: 14,
    compactMode: false,
    showAvatars: true,
    timestampDisplay: 'hover',
    autoScroll: true,
    enterToSend: true,
    showTypingIndicators: true,
    sendReadReceipts: true,
    autoDownloadMedia: 'wifi',
    cacheDuration: 30
})

const notificationSettings = ref({
    enabled: true,
    allMessages: true,
    mentionsOnly: false,
    importantOnly: false,
    soundEnabled: true,
    soundType: 'default',
    volume: 50,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '08:00'
})

const privacySettings = ref({
    messageHistory: 'all',
    screenshotProtection: false,
    autoDeleteDuration: 0,
    preventForwarding: false,
    preventDownload: false
})

const adminSettings = ref({
    whoCanAddMembers: 'admins',
    whoCanEditInfo: 'admins',
    whoCanSendMessages: 'all',
    messageApproval: false,
    restrictLinks: false,
    wordFilter: false,
    welcomeMessage: {
        enabled: false,
        content: 'Chào mừng {{name}} đã tham gia nhóm!'
    }
})

// Modal instance
let modalInstance = null

// Computed
const currentUser = computed(() => authStore.user)

const currentUserMember = computed(() => {
    if (!props.conversation?.participants) return null
    return props.conversation.participants.find(p => p.id === currentUser.value?.id)
})

const canManageGroup = computed(() => {
    if (!props.conversation?.isGroupChat) return false
    const userRole = currentUserMember.value?.role
    return userRole === 'owner' || userRole === 'admin'
})

// Methods
const formatStorageSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadSettings = async () => {
    isLoading.value = true

    try {
        // Try cache first
        const cacheKey = `conversation_settings_${props.conversationId}`
        const cachedSettings = cacheStore.get(cacheKey)

        if (cachedSettings) {
            Object.assign(settings.value, cachedSettings.general || {})
            Object.assign(notificationSettings.value, cachedSettings.notifications || {})
            Object.assign(privacySettings.value, cachedSettings.privacy || {})
            Object.assign(adminSettings.value, cachedSettings.admin || {})
        }

        // Load fresh settings
        const response = await conversationStore.getConversationSettings(props.conversationId)

        if (response.general) Object.assign(settings.value, response.general)
        if (response.notifications) Object.assign(notificationSettings.value, response.notifications)
        if (response.privacy) Object.assign(privacySettings.value, response.privacy)
        if (response.admin) Object.assign(adminSettings.value, response.admin)

        // Cache for 30 minutes
        cacheStore.set(cacheKey, {
            general: settings.value,
            notifications: notificationSettings.value,
            privacy: privacySettings.value,
            admin: adminSettings.value
        }, 30 * 60 * 1000)

        // Load storage usage
        await loadStorageUsage()

    } catch (error) {
        console.error('Load settings error:', error)
        toast.error('Không thể tải cài đặt')
    } finally {
        isLoading.value = false
    }
}

const loadStorageUsage = async () => {
    try {
        const usage = await conversationStore.getStorageUsage(props.conversationId)
        storageUsage.value = usage
    } catch (error) {
        console.error('Load storage usage error:', error)
    }
}

const updateSettings = async () => {
    try {
        await conversationStore.updateConversationSettings(props.conversationId, {
            general: settings.value
        })

        // Update cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        const cached = cacheStore.get(cacheKey) || {}
        cached.general = settings.value
        cacheStore.set(cacheKey, cached, 30 * 60 * 1000)

        emit('settings-updated', { type: 'general', settings: settings.value })

    } catch (error) {
        console.error('Update settings error:', error)
        toast.error('Cập nhật cài đặt thất bại')
    }
}

const updateNotificationSettings = async () => {
    try {
        await conversationStore.updateConversationSettings(props.conversationId, {
            notifications: notificationSettings.value
        })

        // Update cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        const cached = cacheStore.get(cacheKey) || {}
        cached.notifications = notificationSettings.value
        cacheStore.set(cacheKey, cached, 30 * 60 * 1000)

        emit('settings-updated', { type: 'notifications', settings: notificationSettings.value })

    } catch (error) {
        console.error('Update notification settings error:', error)
        toast.error('Cập nhật cài đặt thông báo thất bại')
    }
}

const updatePrivacySettings = async () => {
    try {
        await conversationStore.updateConversationSettings(props.conversationId, {
            privacy: privacySettings.value
        })

        // Update cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        const cached = cacheStore.get(cacheKey) || {}
        cached.privacy = privacySettings.value
        cacheStore.set(cacheKey, cached, 30 * 60 * 1000)

        emit('settings-updated', { type: 'privacy', settings: privacySettings.value })

    } catch (error) {
        console.error('Update privacy settings error:', error)
        toast.error('Cập nhật cài đặt quyền riêng tư thất bại')
    }
}

const updateAdminSettings = async () => {
    if (!canManageGroup.value) return

    try {
        await conversationStore.updateConversationSettings(props.conversationId, {
            admin: adminSettings.value
        })

        // Update cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        const cached = cacheStore.get(cacheKey) || {}
        cached.admin = adminSettings.value
        cacheStore.set(cacheKey, cached, 30 * 60 * 1000)

        emit('settings-updated', { type: 'admin', settings: adminSettings.value })

    } catch (error) {
        console.error('Update admin settings error:', error)
        toast.error('Cập nhật cài đặt quản trị thất bại')
    }
}

const testNotificationSound = () => {
    try {
        const audio = new Audio(`/sounds/${notificationSettings.value.soundType}.mp3`)
        audio.volume = notificationSettings.value.volume / 100
        audio.play()
    } catch (error) {
        console.error('Test sound error:', error)
        toast.warning('Không thể phát âm thanh thử nghiệm')
    }
}

const clearCache = async () => {
    isClearingCache.value = true

    try {
        await conversationStore.clearConversationCache(props.conversationId)

        // Clear local cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        cacheStore.remove(cacheKey)

        // Reload storage usage
        await loadStorageUsage()

        toast.success('Đã xóa cache thành công')

    } catch (error) {
        console.error('Clear cache error:', error)
        toast.error('Xóa cache thất bại')
    } finally {
        isClearingCache.value = false
    }
}

const exportConversationData = async () => {
    isExporting.value = true

    try {
        const blob = await conversationStore.exportConversationData(props.conversationId)

        // Download file
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `conversation_${props.conversationId}_${Date.now()}.zip`
        link.click()

        window.URL.revokeObjectURL(url)

        toast.success('Đã xuất dữ liệu thành công')

    } catch (error) {
        console.error('Export data error:', error)
        toast.error('Xuất dữ liệu thất bại')
    } finally {
        isExporting.value = false
    }
}

const saveAllSettings = async () => {
    isSaving.value = true

    try {
        const allSettings = {
            general: settings.value,
            notifications: notificationSettings.value,
            privacy: privacySettings.value
        }

        if (canManageGroup.value) {
            allSettings.admin = adminSettings.value
        }

        await conversationStore.updateConversationSettings(props.conversationId, allSettings)

        // Update cache
        const cacheKey = `conversation_settings_${props.conversationId}`
        cacheStore.set(cacheKey, allSettings, 30 * 60 * 1000)

        emit('settings-updated', { type: 'all', settings: allSettings })

        toast.success('Đã lưu tất cả cài đặt thành công')

    } catch (error) {
        console.error('Save all settings error:', error)
        toast.error('Lưu cài đặt thất bại')
    } finally {
        isSaving.value = false
    }
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
    emit('close')
}

// Watchers
watch(() => props.show, (show) => {
    if (show) {
        showModal()
        loadSettings()
    } else {
        closeModal()
    }
})

// Lifecycle
onMounted(() => {
    // Initialize Bootstrap modal
    if (modal.value) {
        modalInstance = new Modal(modal.value)
    }

    // Load settings if showing
    if (props.show) {
        showModal()
        loadSettings()
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
    hide: closeModal,
    refresh: loadSettings
})
</script>

<style scoped>
.conversation-settings {
    /* Modal styles handled by Bootstrap */
}

.settings-content {
    max-height: 70vh;
    overflow-y: auto;
}

.settings-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.settings-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.section-title {
    color: var(--bs-primary);
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.setting-info {
    flex: 1;
}

.setting-label {
    font-weight: 500;
    margin-bottom: 0.25rem;
    display: block;
}

.setting-control {
    min-width: 200px;
    max-width: 250px;
}

.font-size-slider {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.font-size-preview {
    font-weight: bold;
    color: var(--bs-primary);
    min-width: 30px;
    text-align: center;
}

.notification-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sound-settings {
    width: 100%;
}

.sound-options {
    margin-top: 0.5rem;
}

.volume-control {
    margin-bottom: 0.5rem;
}

.volume-display {
    text-align: center;
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.quiet-hours .time-range {
    margin-top: 0.5rem;
}

.notification-types {
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 2px solid var(--bs-border-color);
}

.welcome-message-config {
    margin-top: 0.5rem;
    padding: 1rem;
    background-color: var(--bs-light);
    border-radius: 0.375rem;
}

@media (max-width: 768px) {
    .setting-item {
        flex-direction: column;
        align-items: stretch;
    }

    .setting-control {
        min-width: auto;
        max-width: none;
    }

    .font-size-slider {
        flex-direction: column;
        align-items: stretch;
    }

    .notification-types {
        margin-left: 0;
        padding-left: 0;
        border-left: none;
        border-top: 2px solid var(--bs-border-color);
        padding-top: 1rem;
    }

    .welcome-message-config {
        margin-left: 0;
    }
}
</style>