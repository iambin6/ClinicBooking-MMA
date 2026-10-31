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
import { doctorApi, DoctorAppointmentItem } from '../../api/doctor';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Tất cả', dot: '#64748b', bg: '#f1f5f9' },
  { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận', dot: '#3b82f6', bg: '#eff6ff' },
  { key: 'CONFIRMED', label: 'Đã xác nhận', dot: '#1d4ed8', bg: '#dbeafe' },
  { key: 'CHECKED_IN', label: 'Đã đến', dot: '#9333ea', bg: '#f3e8ff' },
  { key: 'IN_PROGRESS', label: 'Đang khám', dot: '#06b6d4', bg: '#cffafe' },
  { key: 'COMPLETED', label: 'Đã khám', dot: '#22c55e', bg: '#dcfce7' },
  { key: 'CANCELLED', label: 'Đã hủy', dot: '#ef4444', bg: '#fee2e2' },
  { key: 'RESCHEDULED', label: 'Đã dời lịch', dot: '#94a3b8', bg: '#f8fafc' },
];

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState<DoctorAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD or '' for all

  // Detail Modal
  const [selectedApt, setSelectedApt] = useState<DoctorAppointmentItem | null>(null);

  // Complete / Prescription Modal
  const [completeModalApt, setCompleteModalApt] = useState<DoctorAppointmentItem | null>(null);
  const [medicineName, setMedicineName] = useState<string>('Khám tổng quát, tư vấn sức khỏe');
  const [dosage, setDosage] = useState<string>('Theo chỉ định');
  const [duration, setDuration] = useState<string>('7 ngày');
  const [instructions, setInstructions] = useState<string>('Nghỉ ngơi, ăn uống điều độ, tái khám nếu cần');

  const loadAppointments = async () => {
    try {
      const data = await doctorApi.getAllDoctorAppointments();
      setAppointments(data);
    } catch (e) {
      console.error('Error loading doctor appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleStart = async (apt: DoctorAppointmentItem) => {
    try {
      setUpdatingId(apt.id);
      await doctorApi.startAppointment(apt.id);
      Alert.alert('Thành công', 'Đã bắt đầu khám cho bệnh nhân!');
      loadAppointments();
      if (selectedApt?.id === apt.id) {
        setSelectedApt((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : null));
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ca khám');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleComplete = (apt: DoctorAppointmentItem) => {
    // Mở modal hoàn thành & kê đơn / kết luận
    setMedicineName('Khám tổng quát, tư vấn sức khỏe');
    setDosage('Theo chỉ định');
    setDuration('7 ngày');
    setInstructions('Nghỉ ngơi, ăn uống điều độ, tái khám nếu cần');
    setCompleteModalApt(apt);
  };

  const handleConfirmComplete = async (withCustomPrescription: boolean) => {
    if (!completeModalApt) return;
    const apt = completeModalApt;

    try {
      setUpdatingId(apt.id);

      const presPayload = withCustomPrescription
        ? {
            medicineName: medicineName.trim() || 'Tư vấn & theo dõi sức khỏe',
            dosage: dosage.trim() || 'Theo chỉ định',
            duration: duration.trim() || '7 ngày',
            instructions: instructions.trim() || 'Nghỉ ngơi, ăn uống điều độ, tái khám nếu cần',
          }
        : undefined;

      await doctorApi.completeAppointment(apt.id, presPayload);

      // Đóng modal
      setCompleteModalApt(null);
      if (selectedApt?.id === apt.id) {
        setSelectedApt(null);
      }

      // Tải lại toàn bộ lịch hẹn
      await loadAppointments();

      // Tự động chuyển ngay vào mục "Đã khám"
      setSelectedStatus('COMPLETED');

      Alert.alert(
        'Khám bệnh hoàn tất',
        `Đã hoàn thành khám cho bệnh nhân ${apt.patientName}!\nLịch hẹn đã được chuyển vào mục "Đã khám".`
      );
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể hoàn tất ca khám');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (selectedStatus !== 'ALL' && apt.status !== selectedStatus) {
        return false;
      }
      // Date filter
      if (filterDate && apt.appointmentDate !== filterDate) {
        return false;
      }
      // Search query (patient name, appointmentNo, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = apt.patientName?.toLowerCase().includes(q);
        const noMatch = apt.appointmentNo?.toLowerCase().includes(q);
        const reasonMatch = apt.reason?.toLowerCase().includes(q);
        if (!nameMatch && !noMatch && !reasonMatch) return false;
      }
      return true;
    });
  }, [appointments, selectedStatus, filterDate, searchQuery]);

  const getStatusInfo = (status: string) => {
    return (
      STATUS_FILTERS.find((s) => s.key === status) || {
        key: status,
        label: status,
        dot: '#64748b',
        bg: '#f1f5f9',
      }
    );
  };

  // Helper date shortcuts
  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch hẹn của Bác sĩ</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý và tiếp nhận bệnh nhân theo danh sách lịch hẹn
        </Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo tên bệnh nhân..."
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

        {/* Date Quick Filter */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={[
              styles.datePill,
              filterDate === '' && styles.datePillActive,
            ]}
            onPress={() => setFilterDate('')}
          >
            <Text
              style={[
                styles.datePillText,
                filterDate === '' && styles.datePillTextActive,
              ]}
            >
              Tất cả ngày
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.datePill,
              filterDate === todayISO && styles.datePillActive,
            ]}
            onPress={() => setFilterDate(todayISO)}
          >
            <Text
              style={[
                styles.datePillText,
                filterDate === todayISO && styles.datePillTextActive,
              ]}
            >
              Hôm nay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.datePill,
              filterDate === tomorrowISO && styles.datePillActive,
            ]}
            onPress={() => setFilterDate(tomorrowISO)}
          >
            <Text
              style={[
                styles.datePillText,
                filterDate === tomorrowISO && styles.datePillTextActive,
              ]}
            >
              Ngày mai
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Horizontal Scroll Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScroll}
        >
          {STATUS_FILTERS.map((s) => {
            const isActive = selectedStatus === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.statusChip,
                  { backgroundColor: isActive ? colors.primary : s.bg },
                ]}
                onPress={() => setSelectedStatus(s.key)}
              >
                <View
                  style={[
                    styles.chipDot,
                    { backgroundColor: isActive ? '#ffffff' : s.dot },
                  ]}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? '#ffffff' : colors.text },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Appointment Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Tìm thấy <Text style={{ fontWeight: '700', color: colors.primary }}>{filteredAppointments.length}</Text> lịch hẹn
        </Text>
        {(selectedStatus !== 'ALL' || filterDate !== '' || searchQuery !== '') && (
          <TouchableOpacity
            onPress={() => {
              setSelectedStatus('ALL');
              setFilterDate('');
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFilterText}>Xóa lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách lịch hẹn...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Không có lịch hẹn nào</Text>
              <Text style={styles.emptySubtitle}>
                Chưa có lịch hẹn nào phù hợp với bộ lọc hiện tại.
              </Text>
            </View>
          ) : (
            filteredAppointments.map((apt) => {
              const statusInfo = getStatusInfo(apt.status);
              const isUpdating = updatingId === apt.id;

              return (
                <View key={apt.id} style={styles.card}>
                  {/* Card Header: Date & Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateTimeBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#2563eb" />
                      <Text style={styles.dateTimeText}>
                        {apt.appointmentDate} • {apt.appointmentTime?.slice(0, 5) || 'Trong ngày'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.dot }]} />
                      <Text style={[styles.statusBadgeText, { color: statusInfo.dot }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Card Body: Patient Name & Details */}
                  <View style={styles.cardBody}>
                    <View style={styles.patientAvatar}>
                      <Ionicons name="person" size={20} color="#0284c7" />
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{apt.patientName}</Text>
                      {apt.reason ? (
                        <Text style={styles.reasonText} numberOfLines={2}>
                          Lý do: {apt.reason}
                        </Text>
                      ) : null}
                      {apt.appointmentNo && (
                        <Text style={styles.aptNoText}>Mã hẹn: #{apt.appointmentNo}</Text>
                      )}
                    </View>
                  </View>

                  {/* Card Footer: Actions */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.btnDetail}
                      onPress={() => setSelectedApt(apt)}
                    >
                      <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                      <Text style={styles.btnDetailText}>Chi tiết</Text>
                    </TouchableOpacity>

                    {apt.status === 'CHECKED_IN' && (
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnStart]}
                        onPress={() => handleStart(apt)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="play" size={14} color="#fff" />
                            <Text style={styles.btnActionText}>Bắt đầu khám</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {apt.status === 'IN_PROGRESS' && (
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnComplete]}
                        onPress={() => handleComplete(apt)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={14} color="#fff" />
                            <Text style={styles.btnActionText}>Hoàn thành khám</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal Hoàn Thành Khám & Kê Đơn */}
      {completeModalApt && (
        <Modal
          visible={Boolean(completeModalApt)}
          transparent
          animationType="slide"
          onRequestClose={() => setCompleteModalApt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Kết luận & Hoàn thành</Text>
                  <Text style={styles.modalSubHeader}>
                    Bệnh nhân: {completeModalApt.patientName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setCompleteModalApt(null)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.presField}>
                  <Text style={styles.presLabel}>Chẩn đoán / Tên thuốc:</Text>
                  <TextInput
                    style={styles.presInput}
                    value={medicineName}
                    onChangeText={setMedicineName}
                    placeholder="Ví dụ: Khám tổng quát, Paracetamol..."
                  />
                </View>

                <View style={styles.presRow}>
                  <View style={[styles.presField, { flex: 1 }]}>
                    <Text style={styles.presLabel}>Liều dùng:</Text>
                    <TextInput
                      style={styles.presInput}
                      value={dosage}
                      onChangeText={setDosage}
                      placeholder="1 viên / lần"
                    />
                  </View>
                  <View style={[styles.presField, { flex: 1 }]}>
                    <Text style={styles.presLabel}>Thời gian:</Text>
                    <TextInput
                      style={styles.presInput}
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="7 ngày"
                    />
                  </View>
                </View>

                <View style={styles.presField}>
                  <Text style={styles.presLabel}>Lời dặn của Bác sĩ:</Text>
                  <TextInput
                    style={[styles.presInput, styles.presTextArea]}
                    multiline
                    numberOfLines={2}
                    value={instructions}
                    onChangeText={setInstructions}
                    placeholder="Uống thuốc sau ăn, tái khám..."
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={[styles.btnCompleteModal, styles.btnQuickComplete]}
                  onPress={() => handleConfirmComplete(false)}
                  disabled={updatingId !== null}
                >
                  {updatingId !== null ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={styles.btnQuickCompleteText}>Hoàn tất ngay (Mặc định)</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnCompleteModal, styles.btnSavePrescription]}
                  onPress={() => handleConfirmComplete(true)}
                  disabled={updatingId !== null}
                >
                  {updatingId !== null ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={16} color="#fff" />
                      <Text style={styles.btnSavePrescriptionText}>Lưu đơn & Hoàn tất</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {selectedApt && (
        <Modal
          visible={Boolean(selectedApt)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedApt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết lịch khám</Text>
                <TouchableOpacity onPress={() => setSelectedApt(null)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bệnh nhân:</Text>
                  <Text style={styles.detailValue}>{selectedApt.patientName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã lịch hẹn:</Text>
                  <Text style={styles.detailValue}>{selectedApt.appointmentNo || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày khám:</Text>
                  <Text style={styles.detailValue}>{selectedApt.appointmentDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giờ khám:</Text>
                  <Text style={styles.detailValue}>{selectedApt.appointmentTime || 'Trong ngày'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: getStatusInfo(selectedApt.status).dot, fontWeight: '700' }]}>
                    {getStatusInfo(selectedApt.status).label}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hình thức:</Text>
                  <Text style={styles.detailValue}>
                    {selectedApt.type === 'ONLINE' ? 'Khám Online từ xa' : 'Khám trực tiếp tại phòng khám'}
                  </Text>
                </View>
                {selectedApt.reason && (
                  <View style={[styles.detailRow, { flexDirection: 'column', gap: 4 }]}>
                    <Text style={styles.detailLabel}>Lý do khám / Triệu chứng:</Text>
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonBoxText}>{selectedApt.reason}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                {selectedApt.status === 'CHECKED_IN' && (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.btnStart]}
                    onPress={() => handleStart(selectedApt)}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                    <Text style={styles.btnActionText}>Bắt đầu buổi khám</Text>
                  </TouchableOpacity>
                )}
                {selectedApt.status === 'IN_PROGRESS' && (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.btnComplete]}
                    onPress={() => handleComplete(selectedApt)}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#fff" />
                    <Text style={styles.btnActionText}>Hoàn thành buổi khám</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedApt(null)}
                >
                  <Text style={styles.modalCloseText}>Đóng</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputWrapper: {
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
  dateFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  datePillActive: {
    backgroundColor: '#2563eb',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  statusScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    color: '#64748b',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  aptNoText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  btnDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnStart: {
    backgroundColor: '#0284c7',
  },
  btnComplete: {
    backgroundColor: '#16a34a',
  },
  btnActionText: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  reasonBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonBoxText: {
    fontSize: 13,
    color: colors.text,
  },
  modalFooter: {
    gap: 8,
  },
  modalActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalSubHeader: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  presField: {
    marginBottom: 12,
  },
  presLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  presInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  presTextArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  presRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalFooterActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 10,
  },
  btnCompleteModal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnQuickComplete: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  btnQuickCompleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  btnSavePrescription: {
    backgroundColor: '#16a34a',
  },
  btnSavePrescriptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
