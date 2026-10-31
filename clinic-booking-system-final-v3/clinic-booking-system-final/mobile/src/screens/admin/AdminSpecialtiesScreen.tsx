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
import { adminApi, AdminSpecialtyItem } from '../../api/admin';

export default function AdminSpecialtiesScreen() {
  const [specialties, setSpecialties] = useState<AdminSpecialtyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State (Image 5)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<AdminSpecialtyItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const list = await adminApi.getAllSpecialties();
      setSpecialties(list);
    } catch (e) {
      console.error('Error loading specialties:', e);
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

  const filteredSpecialties = useMemo(() => {
    if (!searchQuery.trim()) return specialties;
    const q = searchQuery.toLowerCase().trim();
    return specialties.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }, [specialties, searchQuery]);

  const handleOpenCreate = () => {
    setEditingSpecialty(null);
    setName('');
    setDescription('');
    setModalVisible(true);
  };

  const handleOpenUpdate = (item: AdminSpecialtyItem) => {
    setEditingSpecialty(item);
    setName(item.name || '');
    setDescription(item.description || '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chuyên khoa');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSpecialty) {
        // Update (Image 5)
        await adminApi.updateSpecialty(editingSpecialty.id, {
          name: name.trim(),
          description: description.trim(),
        });
        Alert.alert('Thành công', 'Cập nhật chuyên khoa thành công');
      } else {
        // Create
        await adminApi.createSpecialty({
          name: name.trim(),
          description: description.trim(),
        });
        Alert.alert('Thành công', 'Tạo mới chuyên khoa thành công');
      }
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin chuyên khoa';
      Alert.alert('Thất bại', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: AdminSpecialtyItem) => {
    Alert.alert(
      'Xóa chuyên khoa',
      `Bạn có chắc chắn muốn xóa chuyên khoa "${item.name}" (ID: ${item.id})? Lưu ý: Nếu có bác sĩ đang thuộc chuyên khoa này thì không thể xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteSpecialty(item.id);
              Alert.alert('Thành công', 'Đã xóa chuyên khoa');
              loadData();
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                'Không thể xóa chuyên khoa này. Vui lòng đảm bảo không có bác sĩ hoặc lịch khám nào đang gắn với chuyên khoa.';
              Alert.alert('Không thể xóa', msg);
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
          <Text style={styles.headerTitle}>Quản lý chuyên khoa</Text>
          <Text style={styles.headerSubtitle}>Danh mục & chuyên môn phòng khám</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Tạo chuyên khoa</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc mô tả chuyên khoa..."
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

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.metaRow}>
          <Text style={styles.metaCount}>Tổng cộng: {filteredSpecialties.length} chuyên khoa</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách chuyên khoa...</Text>
          </View>
        ) : filteredSpecialties.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="medkit-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Chưa có chuyên khoa nào</Text>
            <Text style={styles.emptySubtitle}>Nhấn nút "+ Tạo chuyên khoa" để thêm mới</Text>
          </View>
        ) : (
          filteredSpecialties.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="medkit" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.titleWrapper}>
                    <Text style={styles.specialtyName}>{item.name}</Text>
                    <Text style={styles.idBadge}>Mã khoa: #{item.id}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => handleOpenUpdate(item)}
                  >
                    <Ionicons name="pencil" size={15} color="#2563eb" />
                    <Text style={styles.actionBtnEditText}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnDelete}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.descriptionLabel}>Mô tả chuyên môn:</Text>
                <Text style={styles.descriptionText}>
                  {item.description || 'Chưa có mô tả chi tiết cho chuyên khoa này.'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ================= MODAL TẠO / CẬP NHẬT CHUYÊN KHOA (IMAGE 5) ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSpecialty ? 'Cập nhật chuyên khoa' : 'Tạo mới chuyên khoa'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên chuyên khoa (Name) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Răng Hàm Mặt, Tai Mũi Họng..."
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mô tả (Description)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Nhập phạm vi khám, tư vấn và chức năng của chuyên khoa..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {editingSpecialty && (
                <Text style={styles.updatingIdLabel}>Updating ID: {editingSpecialty.id}</Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingSpecialty ? 'Update' : 'Create'}
                  </Text>
                )}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  specialtyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  idBadge: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionBtnEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cardBody: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  // Modal (Image 5 style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 110,
  },
  updatingIdLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4338ca',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
