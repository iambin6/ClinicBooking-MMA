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
import { adminApi, AdminUserItem, AdminSpecialtyItem, CreateUserPayload, UpdateDoctorPayload } from '../../api/admin';

export default function AdminDoctorsScreen() {
  const [doctors, setDoctors] = useState<AdminUserItem[]>([]);
  const [specialties, setSpecialties] = useState<AdminSpecialtyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDoctor, setDetailDoctor] = useState<AdminUserItem | null>(null);
  const [updateDoctor, setUpdateDoctor] = useState<AdminUserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Form State (Image 3)
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    userType: 'Doctor',
    gender: 'Male',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    specialtyId: undefined,
    degree: '',
    experience: '',
    description: '',
  });

  // Update Form State (Image 2)
  const [updateForm, setUpdateForm] = useState<UpdateDoctorPayload>({
    fullName: '',
    phoneNumber: '',
    gender: 'Male',
    specialtyId: undefined,
    degree: '',
    experience: '',
    description: '',
  });

  const loadData = async () => {
    try {
      const [rawDocs, specs] = await Promise.all([
        adminApi.getAllDoctors(),
        adminApi.getAllSpecialties(),
      ]);

      const enhancedDocs = rawDocs.map((doc) => {
        const sName = doc.specialtyName || doc.specialization;
        const matchedSpec = specs.find(
          (s) => s.name?.toLowerCase().trim() === sName?.toLowerCase().trim()
        );
        return {
          ...doc,
          specialtyName: sName || (matchedSpec ? matchedSpec.name : ''),
          specialization: sName || (matchedSpec ? matchedSpec.name : ''),
          specialtyId: doc.specialtyId || matchedSpec?.id,
        };
      });

      setDoctors(enhancedDocs);
      setSpecialties(specs);
    } catch (e) {
      console.error('Error loading doctors data:', e);
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

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase().trim();
    return doctors.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(q) ||
        d.specialtyName?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.phoneNumber?.includes(q)
    );
  }, [doctors, searchQuery]);

  // Open Update Modal with prefilled values
  const handleOpenUpdate = (doc: AdminUserItem) => {
    const sName = doc.specialtyName || doc.specialization;
    const matchedSpec = specialties.find(
      (s) => s.name?.toLowerCase().trim() === sName?.toLowerCase().trim()
    );
    const resolvedSpecId = doc.specialtyId || matchedSpec?.id;

    setUpdateDoctor(doc);
    setUpdateForm({
      fullName: doc.fullName || '',
      phoneNumber: doc.phoneNumber || '',
      gender: (doc.gender as any) || 'Male',
      specialtyId: resolvedSpecId,
      degree: doc.degree || '',
      experience: doc.experience || '',
      description: doc.description || '',
    });
  };

  // Submit Create Doctor
  const handleCreateSubmit = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Họ tên, Email và Mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createUser({
        ...createForm,
        userType: 'Doctor',
      });
      Alert.alert('Thành công', `Đã tạo tài khoản bác sĩ ${createForm.fullName}!`);
      setCreateModalVisible(false);
      // Reset form
      setCreateForm({
        userType: 'Doctor',
        gender: 'Male',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        specialtyId: undefined,
        degree: '',
        experience: '',
        description: '',
      });
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi tạo bác sĩ', e?.message || 'Không thể tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update Doctor
  const handleUpdateSubmit = async () => {
    if (!updateDoctor) return;
    if (!updateForm.fullName?.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ và tên không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedSpec = specialties.find((s) => s.id === updateForm.specialtyId);
      const payload: UpdateDoctorPayload = {
        ...updateForm,
        specialization: selectedSpec?.name,
      };

      await adminApi.updateDoctor(updateDoctor.id, payload);
      Alert.alert('Thành công', 'Đã cập nhật thông tin bác sĩ thành công!');
      setUpdateDoctor(null);
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi cập nhật', e?.message || 'Không thể cập nhật thông tin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lý Bác sĩ</Text>
          <Text style={styles.headerSubtitle}>
            Tổng số {doctors.length} bác sĩ trong hệ thống
          </Text>
        </View>

        {/* Nút Tạo bác sĩ (Image 3) */}
        <TouchableOpacity
          style={styles.btnCreate}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="person-add" size={16} color="#ffffff" />
          <Text style={styles.btnCreateText}>Tạo bác sĩ</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredDoctors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không tìm thấy bác sĩ nào phù hợp</Text>
            </View>
          ) : (
            filteredDoctors.map((doc) => (
              <View key={doc.id} style={styles.doctorCard}>
                <View style={styles.cardMain}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.avatarText}>
                      {doc.fullName?.charAt(0) || 'B'}
                    </Text>
                  </View>

                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.fullName}</Text>
                    <View style={styles.specialtyTag}>
                      <Text style={styles.specialtyTagText}>
                        {doc.specialtyName || doc.specialization || 'Chưa phân khoa'}
                      </Text>
                    </View>
                    {doc.degree ? (
                      <Text style={styles.degreeText}>{doc.degree}</Text>
                    ) : null}
                    <Text style={styles.contactText}>
                      📞 {doc.phoneNumber || '—'} • ✉️ {doc.email}
                    </Text>
                  </View>
                </View>

                {/* 2 Nút: Chi tiết và Cập nhật */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.btnDetail}
                    onPress={() => setDetailDoctor(doc)}
                  >
                    <Ionicons name="eye-outline" size={16} color="#0284c7" />
                    <Text style={styles.btnDetailText}>Chi tiết</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnUpdate}
                    onPress={() => handleOpenUpdate(doc)}
                  >
                    <Ionicons name="create-outline" size={16} color="#ffffff" />
                    <Text style={styles.btnUpdateText}>Cập nhật</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ===================== MODAL CHI TIẾT ===================== */}
      {detailDoctor && (
        <Modal visible={Boolean(detailDoctor)} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thông tin Bác sĩ</Text>
                <TouchableOpacity onPress={() => setDetailDoctor(null)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã định danh (ID):</Text>
                  <Text style={styles.detailVal}>#{detailDoctor.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Họ và tên:</Text>
                  <Text style={styles.detailVal}>{detailDoctor.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailVal}>{detailDoctor.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số điện thoại:</Text>
                  <Text style={styles.detailVal}>{detailDoctor.phoneNumber || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Chuyên khoa:</Text>
                  <Text style={[styles.detailVal, { color: '#0284c7', fontWeight: '700' }]}>
                    {detailDoctor.specialtyName || detailDoctor.specialization || 'Chưa phân khoa'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Học vị / Bằng cấp:</Text>
                  <Text style={styles.detailVal}>{detailDoctor.degree || '—'}</Text>
                </View>
                {detailDoctor.experience ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Kinh nghiệm làm việc:</Text>
                    <Text style={styles.detailBlockText}>{detailDoctor.experience}</Text>
                  </View>
                ) : null}
                {detailDoctor.description ? (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Giới thiệu / Mô tả:</Text>
                    <Text style={styles.detailBlockText}>{detailDoctor.description}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalBtnClose}
                  onPress={() => setDetailDoctor(null)}
                >
                  <Text style={styles.modalBtnCloseText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ===================== MODAL CẬP NHẬT BÁC SĨ (Image 2 - Tiếng Việt) ===================== */}
      {updateDoctor && (
        <Modal visible={Boolean(updateDoctor)} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Cập nhật Bác sĩ</Text>
                  <Text style={styles.modalSubtitle}>Đang sửa ID: #{updateDoctor.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setUpdateDoctor(null)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Họ và tên *</Text>
                  <TextInput
                    style={styles.input}
                    value={updateForm.fullName}
                    onChangeText={(t) => setUpdateForm({ ...updateForm, fullName: t })}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>Số điện thoại</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="phone-pad"
                      value={updateForm.phoneNumber}
                      onChangeText={(t) => setUpdateForm({ ...updateForm, phoneNumber: t })}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Giới tính</Text>
                    <View style={styles.genderRow}>
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderPill,
                            updateForm.gender === g && styles.genderPillActive,
                          ]}
                          onPress={() => setUpdateForm({ ...updateForm, gender: g })}
                        >
                          <Text
                            style={[
                              styles.genderPillText,
                              updateForm.gender === g && styles.genderPillTextActive,
                            ]}
                          >
                            {g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Chuyên khoa</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specScroll}>
                    {specialties.map((sp) => {
                      const isSel = updateForm.specialtyId === sp.id;
                      return (
                        <TouchableOpacity
                          key={sp.id}
                          style={[styles.specChip, isSel && styles.specChipActive]}
                          onPress={() => setUpdateForm({ ...updateForm, specialtyId: sp.id })}
                        >
                          <Text style={[styles.specChipText, isSel && styles.specChipTextActive]}>
                            {sp.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Học vị / Bằng cấp</Text>
                  <TextInput
                    style={styles.input}
                    value={updateForm.degree}
                    onChangeText={(t) => setUpdateForm({ ...updateForm, degree: t })}
                    placeholder="BS CKII, Thạc sĩ..."
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Kinh nghiệm</Text>
                  <TextInput
                    style={styles.input}
                    value={updateForm.experience}
                    onChangeText={(t) => setUpdateForm({ ...updateForm, experience: t })}
                    placeholder="Hơn 20 năm tại bệnh viện..."
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mô tả / Giới thiệu</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={updateForm.description}
                    onChangeText={(t) => setUpdateForm({ ...updateForm, description: t })}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.btnModalCancel}
                  onPress={() => setUpdateDoctor(null)}
                  disabled={submitting}
                >
                  <Text style={styles.btnModalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnModalSubmit}
                  onPress={handleUpdateSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.btnModalSubmitText}>Cập nhật</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ===================== MODAL TẠO BÁC SĨ (Image 3) ===================== */}
      {createModalVisible && (
        <Modal visible={createModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo tài khoản Bác sĩ</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Loại tài khoản</Text>
                    <View style={[styles.input, { backgroundColor: '#f1f5f9' }]}>
                      <Text style={{ fontWeight: '700', color: '#2563eb' }}>Bác sĩ (Doctor)</Text>
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>Giới tính</Text>
                    <View style={styles.genderRow}>
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderPill,
                            createForm.gender === g && styles.genderPillActive,
                          ]}
                          onPress={() => setCreateForm({ ...createForm, gender: g })}
                        >
                          <Text
                            style={[
                              styles.genderPillText,
                              createForm.gender === g && styles.genderPillTextActive,
                            ]}
                          >
                            {g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Họ và tên *</Text>
                  <TextInput
                    style={styles.input}
                    value={createForm.fullName}
                    onChangeText={(t) => setCreateForm({ ...createForm, fullName: t })}
                    placeholder="BS. Nguyễn Văn A"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Email đăng nhập *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={createForm.email}
                      onChangeText={(t) => setCreateForm({ ...createForm, email: t })}
                      placeholder="bacsi@clinic.com"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Số điện thoại</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="phone-pad"
                      value={createForm.phoneNumber}
                      onChangeText={(t) => setCreateForm({ ...createForm, phoneNumber: t })}
                      placeholder="0912345678"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mật khẩu khởi tạo *</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={createForm.password}
                    onChangeText={(t) => setCreateForm({ ...createForm, password: t })}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Chọn chuyên khoa</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specScroll}>
                    {specialties.map((sp) => {
                      const isSel = createForm.specialtyId === sp.id;
                      return (
                        <TouchableOpacity
                          key={sp.id}
                          style={[styles.specChip, isSel && styles.specChipActive]}
                          onPress={() => setCreateForm({ ...createForm, specialtyId: sp.id, specialization: sp.name })}
                        >
                          <Text style={[styles.specChipText, isSel && styles.specChipTextActive]}>
                            {sp.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Học vị / Bằng cấp</Text>
                    <TextInput
                      style={styles.input}
                      value={createForm.degree}
                      onChangeText={(t) => setCreateForm({ ...createForm, degree: t })}
                      placeholder="BS CKII, ThS..."
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Kinh nghiệm</Text>
                    <TextInput
                      style={styles.input}
                      value={createForm.experience}
                      onChangeText={(t) => setCreateForm({ ...createForm, experience: t })}
                      placeholder="Hơn 15 năm..."
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mô tả / Tiểu sử</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={2}
                    value={createForm.description}
                    onChangeText={(t) => setCreateForm({ ...createForm, description: t })}
                    placeholder="Mô tả chuyên môn, quá trình công tác..."
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.btnModalCancel}
                  onPress={() => setCreateModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.btnModalCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnModalSubmit}
                  onPress={handleCreateSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.btnModalSubmitText}>Tạo bác sĩ</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btnCreate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCreateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  specialtyTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  specialtyTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  degreeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  btnDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  btnUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  btnUpdateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  detailBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailBlockText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalBtnClose: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillActive: {
    backgroundColor: '#2563eb',
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  genderPillTextActive: {
    color: '#ffffff',
  },
  specScroll: {
    flexDirection: 'row',
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  specChipActive: {
    backgroundColor: '#2563eb',
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  specChipTextActive: {
    color: '#ffffff',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnModalCancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  btnModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  btnModalSubmit: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  btnModalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
