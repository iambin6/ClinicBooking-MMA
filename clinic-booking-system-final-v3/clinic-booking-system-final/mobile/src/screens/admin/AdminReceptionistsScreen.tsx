import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { adminApi, AdminUserItem, CreateUserPayload, UpdateReceptionistPayload } from '../../api/admin';

export default function AdminReceptionistsScreen() {
  const [receptionists, setReceptionists] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<AdminUserItem | null>(null);
  const [updateItem, setUpdateItem] = useState<AdminUserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    userType: 'Receptionist',
    gender: 'Female',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  const [updateForm, setUpdateForm] = useState<UpdateReceptionistPayload>({
    fullName: '',
    phoneNumber: '',
    gender: 'Female',
  });

  const loadData = async () => {
    try {
      const list = await adminApi.getAllReceptionists();
      setReceptionists(list);
    } catch (e) {
      console.error('Error loading receptionists:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredReceptionists = useMemo(() => {
    if (!searchQuery.trim()) return receptionists;
    const q = searchQuery.toLowerCase().trim();
    return receptionists.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phoneNumber?.includes(q)
    );
  }, [receptionists, searchQuery]);

  const handleOpenCreate = () => {
    setCreateForm({
      userType: 'Receptionist',
      gender: 'Female',
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
    });
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên nhân viên lễ tân');
      return;
    }
    if (!createForm.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    if (!createForm.password.trim() || createForm.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createUser(createForm);
      Alert.alert('Thành công', 'Tạo tài khoản Lễ tân thành công! Nhân viên có thể dùng thông tin này để đăng nhập vào hệ thống Lễ tân.');
      setCreateModalVisible(false);
      loadData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Không thể tạo tài khoản lễ tân. Vui lòng kiểm tra lại email.';
      Alert.alert('Thất bại', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdate = (item: AdminUserItem) => {
    setUpdateItem(item);
    setUpdateForm({
      fullName: item.fullName || '',
      phoneNumber: item.phoneNumber || '',
      gender: (item.gender as any) || 'Female',
    });
  };

  const handleUpdateSubmit = async () => {
    if (!updateItem) return;
    if (!updateForm.fullName?.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.updateReceptionist(updateItem.id, updateForm);
      Alert.alert('Thành công', 'Cập nhật thông tin Lễ tân thành công');
      setUpdateItem(null);
      loadData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Lỗi cập nhật lễ tân';
      Alert.alert('Thất bại', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (item: AdminUserItem) => {
    Alert.alert(
      'Xóa tài khoản Lễ tân',
      `Bạn có chắc chắn muốn xóa tài khoản "${item.fullName}" (ID: ${item.id})? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteUser(item.id);
              Alert.alert('Thành công', 'Đã xóa tài khoản lễ tân');
              loadData();
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Không thể xóa tài khoản này.';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lý Lễ tân</Text>
          <Text style={styles.headerSubtitle}>Danh sách & phân quyền nhân viên lễ tân</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Tạo lễ tân</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Receptionists List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.metaRow}>
          <Text style={styles.metaCount}>Tổng cộng: {filteredReceptionists.length} nhân viên</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách lễ tân...</Text>
          </View>
        ) : filteredReceptionists.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="person-remove-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Không tìm thấy nhân viên lễ tân</Text>
            <Text style={styles.emptySubtitle}>Hãy nhấn nút "+ Tạo lễ tân" để thêm mới nhân viên</Text>
          </View>
        ) : (
          filteredReceptionists.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="headset" size={24} color="#d97706" />
                </View>
                <View style={styles.cardMainInfo}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.fullName}>{item.fullName}</Text>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>Lễ tân</Text>
                    </View>
                  </View>
                  <Text style={styles.emailText}>{item.email}</Text>
                  <View style={styles.phoneGenderRow}>
                    <View style={styles.phoneBox}>
                      <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.phoneText}>{item.phoneNumber || '—'}</Text>
                    </View>
                    <View style={styles.genderBox}>
                      <Ionicons name="transgender-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.genderText}>
                        {item.gender === 'Female' ? 'Nữ' : item.gender === 'Male' ? 'Nam' : 'Khác'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => setDetailItem(item)}
                >
                  <Ionicons name="eye-outline" size={15} color={colors.primary} />
                  <Text style={styles.detailBtnText}>Chi tiết</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={() => handleOpenUpdate(item)}
                >
                  <Ionicons name="create-outline" size={15} color="#2563eb" />
                  <Text style={styles.updateBtnText}>Cập nhật</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteUser(item)}
                >
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ================= MODAL TẠO LỄ TÂN ================= */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo tài khoản Lễ tân</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vai trò hệ thống</Text>
                <View style={styles.readOnlyRoleBox}>
                  <Ionicons name="headset-outline" size={16} color="#d97706" />
                  <Text style={styles.readOnlyRoleText}>Lễ tân (Receptionist)</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderSelectRow}>
                  {(['Female', 'Male', 'Other'] as const).map((g) => {
                    const isSelected = createForm.gender === g;
                    const label = g === 'Female' ? 'Nữ' : g === 'Male' ? 'Nam' : 'Khác';
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderChip, isSelected && styles.genderChipActive]}
                        onPress={() => setCreateForm({ ...createForm, gender: g })}
                      >
                        <Text style={[styles.genderChipText, isSelected && styles.genderChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập họ và tên nhân viên..."
                  value={createForm.fullName}
                  onChangeText={(val) => setCreateForm({ ...createForm, fullName: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="letan@clinicbooking.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={createForm.email}
                  onChangeText={(val) => setCreateForm({ ...createForm, email: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0988xxxxxx"
                  keyboardType="phone-pad"
                  value={createForm.phoneNumber}
                  onChangeText={(val) => setCreateForm({ ...createForm, phoneNumber: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu đăng nhập *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ít nhất 6 ký tự"
                  secureTextEntry
                  value={createForm.password}
                  onChangeText={(val) => setCreateForm({ ...createForm, password: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Tạo mới</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL CẬP NHẬT LỄ TÂN ================= */}
      <Modal visible={!!updateItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật thông tin Lễ tân</Text>
              <TouchableOpacity onPress={() => setUpdateItem(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <TextInput
                  style={styles.textInput}
                  value={updateForm.fullName}
                  onChangeText={(val) => setUpdateForm({ ...updateForm, fullName: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  value={updateForm.phoneNumber}
                  onChangeText={(val) => setUpdateForm({ ...updateForm, phoneNumber: val })}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderSelectRow}>
                  {(['Female', 'Male', 'Other'] as const).map((g) => {
                    const isSelected = updateForm.gender === g;
                    const label = g === 'Female' ? 'Nữ' : g === 'Male' ? 'Nam' : 'Khác';
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderChip, isSelected && styles.genderChipActive]}
                        onPress={() => setUpdateForm({ ...updateForm, gender: g })}
                      >
                        <Text style={[styles.genderChipText, isSelected && styles.genderChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.updatingIdLabel}>Mã ID: {updateItem?.id}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUpdateItem(null)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpdateSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL CHI TIẾT LỄ TÂN ================= */}
      <Modal visible={!!detailItem} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết Lễ tân</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {detailItem && (
              <ScrollView contentContainerStyle={styles.detailScroll}>
                <View style={styles.detailAvatarSection}>
                  <View style={styles.detailAvatarCircle}>
                    <Ionicons name="headset" size={40} color="#d97706" />
                  </View>
                  <Text style={styles.detailFullName}>{detailItem.fullName}</Text>
                  <Text style={styles.detailRole}>Nhân viên Lễ tân</Text>
                </View>

                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã nhân viên (ID):</Text>
                    <Text style={styles.detailValue}>#{detailItem.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email đăng nhập:</Text>
                    <Text style={styles.detailValue}>{detailItem.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>{detailItem.phoneNumber || 'Chưa cập nhật'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giới tính:</Text>
                    <Text style={styles.detailValue}>
                      {detailItem.gender === 'Female' ? 'Nữ' : detailItem.gender === 'Male' ? 'Nam' : 'Khác'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Trạng thái tài khoản:</Text>
                    <Text style={[styles.detailValue, { color: '#16a34a', fontWeight: '700' }]}>
                      Hoạt động
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1 }]}
                onPress={() => setDetailItem(null)}
              >
                <Text style={styles.submitBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMainInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  roleTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  emailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  phoneGenderRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  genderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  updateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  formScroll: {
    padding: 16,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  readOnlyRoleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  readOnlyRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genderChipActive: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  updatingIdLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // Detail
  detailScroll: {
    padding: 16,
    gap: 16,
  },
  detailAvatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailFullName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailRole: {
    fontSize: 13,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
});
