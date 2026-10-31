import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { doctorApi, DoctorShiftItem, ShiftType, DoctorAppointmentItem } from '../../api/doctor';
import DoctorRegisterShiftModal from './DoctorRegisterShiftModal';

const SLOT_ORDER: ShiftType[] = ['MORNING', 'AFTERNOON', 'EVENING'];
const SLOT_LABEL: Record<ShiftType, { title: string; time: string }> = {
  MORNING: { title: 'Sáng', time: '08:00 - 12:00' },
  AFTERNOON: { title: 'Chiều', time: '13:00 - 17:00' },
  EVENING: { title: 'Tối', time: '18:00 - 21:00' },
};

const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_LONG = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

function getISOWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDM(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export default function DoctorShiftsScreen() {
  const [shifts, setShifts] = useState<DoctorShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Week navigation base date
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  // Selected day tab for single-day quick view
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // 0=Mon..6=Sun
  });

  // Shift details modal
  const [selectedShift, setSelectedShift] = useState<{
    shift: DoctorShiftItem;
    appointments: DoctorAppointmentItem[];
  } | null>(null);
  const [loadingShiftApts, setLoadingShiftApts] = useState(false);

  // Appointments count by shift id
  const [shiftAppCounts, setShiftAppCounts] = useState<Record<number, number>>({});

  const monday = useMemo(() => getISOWeekStart(baseDate), [baseDate]);

  // Headers for 7 days
  const headers = useMemo(() => {
    const list: { iso: string; label: string; shortDay: string; fullDay: string; dateObj: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      list.push({
        iso: toISO(d),
        label: formatDM(d),
        shortDay: DAY_SHORT[i],
        fullDay: DAY_LONG[i],
        dateObj: d,
      });
    }
    return list;
  }, [monday]);

  const weekRangeLabel = useMemo(() => {
    const start = headers[0];
    const end = headers[6];
    if (!start || !end) return '';
    return `${start.label} - ${end.label}/${start.dateObj.getFullYear()}`;
  }, [headers]);

  // Fetch shifts
  const loadShifts = useCallback(async () => {
    try {
      const list = await doctorApi.getMyShifts();
      setShifts(list);

      // Load appointment count for each shift
      const counts: Record<number, number> = {};
      const promises = list.map(async (s) => {
        try {
          const apts = await doctorApi.getAppointmentsByShift(s.id);
          counts[s.id] = apts.length;
        } catch {
          counts[s.id] = 0;
        }
      });
      await Promise.all(promises);
      setShiftAppCounts(counts);
    } catch (e) {
      console.error('Error loading shifts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadShifts();
  };

  // Build grid map: grid[SLOT][ISO_DATE] = DoctorShiftItem
  const grid = useMemo(() => {
    const map: Record<ShiftType, Record<string, DoctorShiftItem | undefined>> = {
      MORNING: {},
      AFTERNOON: {},
      EVENING: {},
    };

    for (const s of shifts) {
      if (map[s.shift]) {
        map[s.shift][s.date] = s;
      }
    }
    return map;
  }, [shifts]);

  const handlePrevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(prev.getDate() - 7);
    setBaseDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    setBaseDate(next);
  };

  const handleOpenShiftDetails = async (shift: DoctorShiftItem) => {
    setSelectedShift({ shift, appointments: [] });
    setLoadingShiftApts(true);
    try {
      const apts = await doctorApi.getAppointmentsByShift(shift.id);
      setSelectedShift({ shift, appointments: apts });
    } catch (e) {
      console.error('Error loading shift appointments:', e);
    } finally {
      setLoadingShiftApts(false);
    }
  };

  const activeDay = headers[activeDayIndex] || headers[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ca khám của tôi</Text>
          <Text style={styles.headerSubtitle}>Tuần: {weekRangeLabel}</Text>
        </View>

        {/* Button Đăng ký lịch (Image 3 & 5) */}
        <TouchableOpacity
          style={styles.btnRegister}
          onPress={() => setRegisterModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.btnRegisterText}>Đăng ký lịch</Text>
        </TouchableOpacity>
      </View>

      {/* Week Navigator Bar */}
      <View style={styles.weekNavBar}>
        <TouchableOpacity style={styles.weekNavArrow} onPress={handlePrevWeek}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.weekBadge}>
          <Ionicons name="calendar-outline" size={14} color="#2563eb" />
          <Text style={styles.weekBadgeText}>{weekRangeLabel}</Text>
        </View>
        <TouchableOpacity style={styles.weekNavArrow} onPress={handleNextWeek}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Selector Tabs for Easy Mobile Tap */}
      <View style={styles.dayTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
          {headers.map((h, idx) => {
            const isActive = activeDayIndex === idx;
            // Check if this day has any registered shifts
            const hasShift =
              Boolean(grid.MORNING[h.iso]) ||
              Boolean(grid.AFTERNOON[h.iso]) ||
              Boolean(grid.EVENING[h.iso]);

            return (
              <TouchableOpacity
                key={h.iso}
                style={[
                  styles.dayTabItem,
                  isActive && styles.dayTabItemActive,
                ]}
                onPress={() => setActiveDayIndex(idx)}
              >
                <Text style={[styles.dayTabShort, isActive && styles.dayTabShortActive]}>
                  {h.shortDay}
                </Text>
                <Text style={[styles.dayTabDate, isActive && styles.dayTabDateActive]}>
                  {h.label}
                </Text>
                {hasShift && (
                  <View style={[styles.hasShiftDot, isActive && { backgroundColor: '#ffffff' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch ca trực...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Section: Chi tiết ca trong ngày được chọn */}
          <View style={styles.dayDetailCard}>
            <View style={styles.dayDetailHeader}>
              <View>
                <Text style={styles.dayDetailTitle}>{activeDay.fullDay}</Text>
                <Text style={styles.dayDetailDate}>{activeDay.label} - Chi tiết ca trực</Text>
              </View>
              <TouchableOpacity
                style={styles.btnAddQuick}
                onPress={() => setRegisterModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                <Text style={styles.btnAddQuickText}>Đăng ký thêm</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.slotList}>
              {SLOT_ORDER.map((slot) => {
                const shiftItem = grid[slot][activeDay.iso];
                const info = SLOT_LABEL[slot];
                const appCount = shiftItem ? (shiftAppCounts[shiftItem.id] || 0) : 0;

                return (
                  <View key={slot} style={styles.slotCard}>
                    <View style={styles.slotCardLeft}>
                      <View
                        style={[
                          styles.slotIconBox,
                          shiftItem ? styles.slotIconBoxRegistered : styles.slotIconBoxEmpty,
                        ]}
                      >
                        <Ionicons
                          name={slot === 'MORNING' ? 'sunny' : slot === 'AFTERNOON' ? 'partly-sunny' : 'moon'}
                          size={20}
                          color={shiftItem ? '#0284c7' : '#94a3b8'}
                        />
                      </View>
                      <View>
                        <Text style={styles.slotNameText}>{info.title}</Text>
                        <Text style={styles.slotTimeText}>{info.time}</Text>
                      </View>
                    </View>

                    {/* Right side: Badge ĐÃ ĐĂNG KÝ as shown in Image 5 */}
                    {shiftItem ? (
                      <TouchableOpacity
                        style={styles.registeredBox}
                        onPress={() => handleOpenShiftDetails(shiftItem)}
                      >
                        <View style={styles.registeredBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#0284c7" />
                          <Text style={styles.registeredBadgeText}>ĐÃ ĐĂNG KÝ</Text>
                        </View>
                        <Text style={styles.subtextAppointments}>
                          {appCount > 0 ? `${appCount} lịch hẹn` : 'Chưa có lịch hẹn'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.emptySlotIndicator}>
                        <Text style={styles.emptySlotDash}>—</Text>
                        <Text style={styles.emptySlotSub}>Chưa đăng ký</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section: Bảng Lưới Ca Tuần (Full Week Matrix - Image 3 & 5 style) */}
          <View style={styles.weekMatrixSection}>
            <View style={styles.matrixSectionHeader}>
              <Ionicons name="grid-outline" size={18} color="#2563eb" />
              <Text style={styles.matrixSectionTitle}>Bảng tổng hợp tuần</Text>
            </View>

            {/* Horizontal Scroll Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableRowHeader}>
                  <View style={[styles.tableCell, styles.cellFirstHeader]}>
                    <Text style={styles.headerCellText}>Ca trực</Text>
                  </View>
                  {headers.map((h) => (
                    <View key={h.iso} style={[styles.tableCell, styles.cellHeader]}>
                      <Text style={styles.headerDayText}>{h.shortDay}</Text>
                      <Text style={styles.headerDateText}>{h.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Rows for Morning, Afternoon, Evening */}
                {SLOT_ORDER.map((slot) => {
                  const info = SLOT_LABEL[slot];

                  return (
                    <View key={slot} style={styles.tableRow}>
                      {/* First column: Shift Name & Hours */}
                      <View style={[styles.tableCell, styles.cellFirst]}>
                        <Text style={styles.rowSlotTitle}>{info.title}</Text>
                        <Text style={styles.rowSlotTime}>{info.time}</Text>
                      </View>

                      {/* 7 Days columns */}
                      {headers.map((h) => {
                        const shiftItem = grid[slot][h.iso];
                        const count = shiftItem ? (shiftAppCounts[shiftItem.id] || 0) : 0;

                        return (
                          <View key={h.iso} style={[styles.tableCell, styles.cellData]}>
                            {shiftItem ? (
                              <TouchableOpacity
                                style={styles.matrixRegisteredBox}
                                onPress={() => handleOpenShiftDetails(shiftItem)}
                              >
                                <View style={styles.matrixBadge}>
                                  <Text style={styles.matrixBadgeText}>ĐÃ ĐĂNG KÝ</Text>
                                </View>
                                <Text style={styles.matrixSubtext}>
                                  {count > 0 ? `${count} hẹn` : 'Chưa có hẹn'}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={styles.matrixDash}>—</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Register Shift Modal (Image 4) */}
      <DoctorRegisterShiftModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onSuccess={() => loadShifts()}
        existingShifts={shifts}
      />

      {/* Shift Details Modal */}
      {selectedShift && (
        <Modal
          visible={Boolean(selectedShift)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedShift(null)}
        >
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalBox}>
              <View style={styles.detailModalHeader}>
                <View>
                  <Text style={styles.detailModalTitle}>
                    Ca {SLOT_LABEL[selectedShift.shift.shift].title} - {selectedShift.shift.date}
                  </Text>
                  <Text style={styles.detailModalTime}>
                    {selectedShift.shift.startTime} - {selectedShift.shift.endTime}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedShift(null)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailModalBody}>
                <View style={styles.shiftMetaRow}>
                  <Text style={styles.shiftMetaLabel}>Bệnh nhân tối đa:</Text>
                  <Text style={styles.shiftMetaValue}>{selectedShift.shift.maxPatients} người</Text>
                </View>
                {selectedShift.shift.note ? (
                  <View style={styles.shiftMetaRow}>
                    <Text style={styles.shiftMetaLabel}>Ghi chú:</Text>
                    <Text style={styles.shiftMetaValue}>{selectedShift.shift.note}</Text>
                  </View>
                ) : null}

                <Text style={styles.shiftAptsTitle}>
                  Danh sách cuộc hẹn ({selectedShift.appointments.length}):
                </Text>

                {loadingShiftApts ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : selectedShift.appointments.length === 0 ? (
                  <View style={styles.noAptsBox}>
                    <Ionicons name="file-tray-outline" size={32} color="#94a3b8" />
                    <Text style={styles.noAptsText}>Chưa có bệnh nhân nào đặt lịch trong ca này.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 240 }}>
                    {selectedShift.appointments.map((a) => (
                      <View key={a.id} style={styles.aptMiniCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.aptMiniName}>{a.patientName}</Text>
                          <Text style={styles.aptMiniTime}>
                            Giờ: {a.appointmentTime?.slice(0, 5) || 'Trong ca'} • Mã: #{a.appointmentNo || a.id}
                          </Text>
                        </View>
                        <View style={styles.aptMiniStatus}>
                          <Text style={styles.aptMiniStatusText}>{a.status}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              <TouchableOpacity
                style={styles.detailModalCloseBtn}
                onPress={() => setSelectedShift(null)}
              >
                <Text style={styles.detailModalCloseText}>Đóng</Text>
              </TouchableOpacity>
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
  btnRegister: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  btnRegisterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  weekNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  weekNavArrow: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  dayTabsWrapper: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTabItem: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabItemActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  dayTabShort: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dayTabShortActive: {
    color: '#ffffff',
  },
  dayTabDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayTabDateActive: {
    color: '#dbeafe',
  },
  hasShiftDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0284c7',
    marginTop: 3,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dayDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  dayDetailDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  btnAddQuick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnAddQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  slotList: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  slotCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotIconBoxRegistered: {
    backgroundColor: '#e0f2fe',
  },
  slotIconBoxEmpty: {
    backgroundColor: '#f1f5f9',
  },
  slotNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  slotTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  registeredBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registeredBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  subtextAppointments: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  emptySlotIndicator: {
    alignItems: 'center',
  },
  emptySlotDash: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  emptySlotSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  weekMatrixSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  matrixSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  matrixSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  tableScroll: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  table: {
    backgroundColor: '#ffffff',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    width: 95,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  cellFirstHeader: {
    width: 110,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  cellHeader: {
    alignItems: 'center',
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  headerDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  headerDateText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  cellFirst: {
    width: 110,
    alignItems: 'flex-start',
    paddingLeft: 10,
    backgroundColor: '#f8fafc',
  },
  rowSlotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  rowSlotTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  cellData: {
    minHeight: 64,
  },
  matrixRegisteredBox: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    width: '95%',
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  matrixBadge: {
    marginBottom: 2,
  },
  matrixBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
  },
  matrixSubtext: {
    fontSize: 9,
    color: '#64748b',
  },
  matrixDash: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  detailModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  detailModalTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailModalBody: {
    marginBottom: 16,
  },
  shiftMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shiftMetaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  shiftMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  shiftAptsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  noAptsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAptsText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  aptMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aptMiniName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  aptMiniTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  aptMiniStatus: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aptMiniStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  detailModalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  detailModalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
