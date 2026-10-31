import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { adminApi, AdminShiftItem, AdminSpecialtyItem } from '../../api/admin';

// Helper tính ngày đầu tuần (Thứ 2) và cuối tuần (Chủ nhật)
function getWeekRange(refDate: Date) {
  const d = new Date(refDate);
  const day = d.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date): { dayName: string; dateStr: string; iso: string } {
  const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  const fullDays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayIndex = d.getDay();
  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return {
    dayName: days[dayIndex],
    dateStr,
    iso: formatDateISO(d),
  };
}

const SHIFT_TYPES: Array<{
  key: 'MORNING' | 'AFTERNOON' | 'EVENING';
  title: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { key: 'MORNING', title: 'Sáng', time: '08:00 - 12:00', icon: 'sunny-outline', color: '#f59e0b' },
  { key: 'AFTERNOON', title: 'Chiều', time: '13:00 - 17:00', icon: 'partly-sunny-outline', color: '#3b82f6' },
  { key: 'EVENING', title: 'Tối', time: '18:00 - 21:00', icon: 'moon-outline', color: '#8b5cf6' },
];

export default function AdminShiftsScreen() {
  const [currentRefDate, setCurrentRefDate] = useState<Date>(new Date(2026, 9, 31)); // 31/10/2026
  const [shifts, setShifts] = useState<AdminShiftItem[]>([]);
  const [specialties, setSpecialties] = useState<AdminSpecialtyItem[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'day'>('matrix');
  const [selectedDayISO, setSelectedDayISO] = useState<string>('2026-10-31');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { monday, sunday } = useMemo(() => getWeekRange(currentRefDate), [currentRefDate]);

  // Sinh 7 ngày trong tuần từ Thứ 2 đến Chủ nhật
  const weekDays = useMemo(() => {
    const list: Array<{ date: Date; dayName: string; dateStr: string; iso: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const { dayName, dateStr, iso } = formatDayLabel(d);
      list.push({ date: d, dayName, dateStr, iso });
    }
    return list;
  }, [monday]);

  const loadData = async () => {
    try {
      const startISO = formatDateISO(monday);
      const endISO = formatDateISO(sunday);

      const [shiftsData, specsData] = await Promise.all([
        adminApi.getShiftsInWeek(startISO, endISO),
        adminApi.getAllSpecialties(),
      ]);

      setShifts(shiftsData);
      setSpecialties(specsData);
    } catch (e) {
      console.error('Error loading shifts for week:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [monday, sunday]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentRefDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentRefDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentRefDate);
    next.setDate(next.getDate() + 7);
    setCurrentRefDate(next);
  };

  const handleCurrentWeek = () => {
    setCurrentRefDate(new Date(2026, 9, 31));
  };

  // Lọc shifts theo chuyên khoa nếu có chọn
  const filteredShifts = useMemo(() => {
    if (selectedSpecialty === 'ALL') return shifts;
    return shifts.filter(
      (s) => s.specialtyName?.trim().toLowerCase() === selectedSpecialty.trim().toLowerCase()
    );
  }, [shifts, selectedSpecialty]);

  // Index shifts theo dạng: `YYYY-MM-DD_SHIFT_TYPE` -> AdminShiftItem[]
  const shiftMap = useMemo(() => {
    const map = new Map<string, AdminShiftItem[]>();
    for (const s of filteredShifts) {
      const key = `${s.date}_${s.shiftType}`;
      const existing = map.get(key) || [];
      existing.push(s);
      map.set(key, existing);
    }
    return map;
  }, [filteredShifts]);

  const weekHeaderLabel = `Tuần: ${formatDayLabel(monday).dateStr} - ${formatDayLabel(sunday).dateStr}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lịch làm việc theo tuần</Text>
          <Text style={styles.headerSubtitle}>Quản lý phân ca trực của bác sĩ</Text>
        </View>

        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'matrix' && styles.toggleBtnActive]}
            onPress={() => setViewMode('matrix')}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={viewMode === 'matrix' ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
            onPress={() => setViewMode('day')}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={viewMode === 'day' ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Navigator Bar */}
      <View style={styles.weekNav}>
        <TouchableOpacity style={styles.navArrow} onPress={handlePrevWeek}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.weekRangeText}>{weekHeaderLabel}</Text>
          <TouchableOpacity onPress={handleCurrentWeek} style={styles.todayPill}>
            <Text style={styles.todayPillText}>Tuần này</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navArrow} onPress={handleNextWeek}>
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Specialty Filter Pill Carousel */}
      <View style={styles.specialtySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedSpecialty === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedSpecialty('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSpecialty === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              Tất cả chuyên khoa
            </Text>
          </TouchableOpacity>
          {specialties.map((spec) => {
            const isActive = selectedSpecialty === spec.name;
            return (
              <TouchableOpacity
                key={spec.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedSpecialty(spec.name)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch làm việc...</Text>
        </View>
      ) : viewMode === 'matrix' ? (
        /* MATRIX TABLE VIEW (Image 4) */
        <ScrollView
          style={styles.matrixContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.cell, styles.colShiftHeader]}>
                  <Text style={styles.headerColText}>Ca trực</Text>
                </View>
                {weekDays.map((d) => (
                  <View key={d.iso} style={[styles.cell, styles.colDayHeader]}>
                    <Text style={styles.headerColText}>{d.dayName}</Text>
                    <Text style={styles.headerDateText}>{d.dateStr}</Text>
                  </View>
                ))}
              </View>

              {/* Table Rows for Each Shift */}
              {SHIFT_TYPES.map((shift) => (
                <View key={shift.key} style={styles.tableRow}>
                  {/* Left Shift Title Cell */}
                  <View style={[styles.cell, styles.colShiftTitle]}>
                    <View style={styles.shiftTitleWrapper}>
                      <Ionicons name={shift.icon} size={16} color={shift.color} />
                      <Text style={styles.shiftName}>{shift.title}</Text>
                    </View>
                    <Text style={styles.shiftTime}>{shift.time}</Text>
                  </View>

                  {/* 7 Days Columns */}
                  {weekDays.map((d) => {
                    const key = `${d.iso}_${shift.key}`;
                    const items = shiftMap.get(key) || [];

                    return (
                      <View key={d.iso} style={[styles.cell, styles.colDataCell]}>
                        {items.length === 0 ? (
                          <Text style={styles.emptyDash}>—</Text>
                        ) : (
                          items.map((it) => (
                            <View key={it.id} style={styles.doctorBadgeCard}>
                              <Text style={styles.docName} numberOfLines={2}>
                                {it.doctorName}
                              </Text>
                              {!!it.specialtyName && (
                                <View style={styles.specialtyTag}>
                                  <Text style={styles.specialtyTagText} numberOfLines={1}>
                                    {it.specialtyName}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.matrixFooterNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.footerNoteText}>
              Bảng hiển thị ma trận 7 ngày. Bạn có thể vuốt sang ngang để xem đủ tất cả các thứ trong tuần.
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* DAY BY DAY VIEW */
        <ScrollView
          style={styles.dayViewContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Day Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {weekDays.map((d) => {
              const isSelected = selectedDayISO === d.iso;
              return (
                <TouchableOpacity
                  key={d.iso}
                  style={[styles.dayCardBtn, isSelected && styles.dayCardBtnActive]}
                  onPress={() => setSelectedDayISO(d.iso)}
                >
                  <Text style={[styles.dayCardDayName, isSelected && styles.dayCardTextActive]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dayCardDateStr, isSelected && styles.dayCardTextActive]}>
                    {d.dateStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cards for each shift type on the selected day */}
          <View style={styles.shiftCardsList}>
            {SHIFT_TYPES.map((shift) => {
              const key = `${selectedDayISO}_${shift.key}`;
              const items = shiftMap.get(key) || [];

              return (
                <View key={shift.key} style={styles.shiftCard}>
                  <View style={styles.shiftCardHeader}>
                    <View style={styles.shiftCardHeaderLeft}>
                      <View style={[styles.shiftIconBox, { backgroundColor: `${shift.color}18` }]}>
                        <Ionicons name={shift.icon} size={20} color={shift.color} />
                      </View>
                      <View>
                        <Text style={styles.shiftCardTitle}>Ca {shift.title}</Text>
                        <Text style={styles.shiftCardTime}>{shift.time}</Text>
                      </View>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{items.length} bác sĩ</Text>
                    </View>
                  </View>

                  {items.length === 0 ? (
                    <View style={styles.noShiftBox}>
                      <Text style={styles.noShiftText}>Chưa có bác sĩ trực trong ca này</Text>
                    </View>
                  ) : (
                    <View style={styles.doctorGrid}>
                      {items.map((it) => (
                        <View key={it.id} style={styles.doctorItemRow}>
                          <View style={styles.doctorAvatar}>
                            <Ionicons name="person" size={18} color="#2563eb" />
                          </View>
                          <View style={styles.doctorInfo}>
                            <Text style={styles.doctorFullName}>BS. {it.doctorName}</Text>
                            <Text style={styles.doctorSpecialtyText}>
                              {it.specialtyName || 'Chuyên khoa tổng quát'}
                            </Text>
                          </View>
                          <View style={styles.activeStatusPill}>
                            <View style={styles.statusDot} />
                            <Text style={styles.activeStatusText}>Đang trực</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekRangeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todayPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  specialtySection: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Table Matrix
  matrixContainer: {
    flex: 1,
  },
  table: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 110,
  },
  cell: {
    padding: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  colShiftHeader: {
    width: 105,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  colDayHeader: {
    width: 125,
    alignItems: 'center',
  },
  headerColText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  colShiftTitle: {
    width: 105,
    backgroundColor: '#fbfcfd',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  shiftTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  shiftName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shiftTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  colDataCell: {
    width: 125,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 6,
    padding: 6,
  },
  emptyDash: {
    fontSize: 18,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 35,
  },
  doctorBadgeCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 6,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  specialtyTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  specialtyTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#15803d',
  },
  matrixFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  // Day View
  dayViewContainer: {
    flex: 1,
    padding: 12,
  },
  daySelectorScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  dayCardBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 64,
  },
  dayCardBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCardDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayCardDateStr: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dayCardTextActive: {
    color: '#fff',
  },
  shiftCardsList: {
    gap: 12,
    paddingBottom: 30,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shiftCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shiftCardTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noShiftBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  noShiftText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  doctorGrid: {
    gap: 10,
  },
  doctorItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doctorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorFullName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doctorSpecialtyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
});
