import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { doctorApi, ShiftType, DoctorShiftItem } from '../../api/doctor';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingShifts: DoctorShiftItem[];
}

const SHIFT_TYPES: { key: ShiftType; label: string; time: string }[] = [
  { key: 'MORNING', label: 'Sáng', time: '08:00 - 12:00' },
  { key: 'AFTERNOON', label: 'Chiều', time: '13:00 - 17:00' },
  { key: 'EVENING', label: 'Tối', time: '18:00 - 21:00' },
];

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

// Monday as start of week
function getMonday(date = new Date()) {
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

export default function DoctorRegisterShiftModal({
  visible,
  onClose,
  onSuccess,
  existingShifts,
}: Props) {
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [maxPatients, setMaxPatients] = useState<string>('10');
  const [note, setNote] = useState<string>('');
  const [repeatWeekly, setRepeatWeekly] = useState<boolean>(false);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const monday = useMemo(() => getMonday(baseDate), [baseDate]);

  // Generate 7 days for the current week
  const weekDays = useMemo(() => {
    const todayISO = toISO(new Date());
    const list: {
      iso: string;
      label: string;
      shortDay: string;
      fullDay: string;
      isPast: boolean;
      dateObj: Date;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = toISO(d);
      list.push({
        iso,
        label: formatDM(d),
        shortDay: DAY_NAMES[i],
        fullDay: DAY_FULL[i],
        isPast: iso < todayISO,
        dateObj: d,
      });
    }
    return list;
  }, [monday]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (!start || !end) return '';
    return `${start.label} - ${end.label}`;
  }, [weekDays]);

  // Map of existing shifts: key = "YYYY-MM-DD|SHIFT"
  const existingMap = useMemo(() => {
    const map = new Set<string>();
    for (const s of existingShifts) {
      map.add(`${s.date}|${s.shift}`);
    }
    return map;
  }, [existingShifts]);

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedSlots(new Set());
      setNote('');
      setMaxPatients('10');
      setRepeatWeekly(false);
      setRepeatCount(1);
    }
  }, [visible]);

  const toggleSlot = (iso: string, shift: ShiftType, isDisabled: boolean) => {
    if (isDisabled) return;
    const key = `${iso}|${shift}`;
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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

  const handleSubmit = async () => {
    if (selectedSlots.size === 0) {
      Alert.alert('Chưa chọn ca', 'Vui lòng chọn ít nhất 1 ca làm việc trong tuần này.');
      return;
    }

    const maxCount = parseInt(maxPatients, 10);
    if (isNaN(maxCount) || maxCount <= 0) {
      Alert.alert('Lỗi nhập liệu', 'Số bệnh nhân tối đa phải là số dương lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      // Create each shift slot
      const promises = Array.from(selectedSlots).map((key) => {
        const [date, shift] = key.split('|');
        return doctorApi.createShift({
          date,
          shift: shift as ShiftType,
          maxPatients: maxCount,
          note: note.trim() || undefined,
          repeatWeekly,
          repeatCount: repeatWeekly ? repeatCount : 0,
        });
      });

      await Promise.all(promises);
      Alert.alert('Thành công', `Đã đăng ký thành công ${selectedSlots.size} ca làm việc!`);
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi khi đăng ký ca làm việc';
      Alert.alert('Đăng ký thất bại', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Đăng ký lịch làm việc</Text>
              <Text style={styles.subtitle}>Tuần: {weekRangeLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Warning note as shown in Image 4 */}
            <View style={styles.warningNote}>
              <Ionicons name="information-circle-outline" size={18} color="#d97706" />
              <Text style={styles.warningText}>
                Không thể đăng ký cho ngày đã qua; ca đã có sẽ bị khóa.
              </Text>
            </View>

            {/* Week navigation */}
            <View style={styles.weekNav}>
              <TouchableOpacity style={styles.weekNavBtn} onPress={handlePrevWeek}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
                <Text style={styles.weekNavText}>Tuần trước</Text>
              </TouchableOpacity>
              <View style={styles.currentWeekTag}>
                <Ionicons name="calendar-outline" size={14} color="#2563eb" />
                <Text style={styles.currentWeekText}>{weekRangeLabel}</Text>
              </View>
              <TouchableOpacity style={styles.weekNavBtn} onPress={handleNextWeek}>
                <Text style={styles.weekNavText}>Tuần sau</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Shift Picker Matrix / Day-by-Day */}
            <View style={styles.matrixContainer}>
              {weekDays.map((day) => {
                return (
                  <View
                    key={day.iso}
                    style={[
                      styles.dayRow,
                      day.isPast && styles.dayRowPast,
                    ]}
                  >
                    {/* Day Column */}
                    <View style={styles.dayInfoCol}>
                      <Text
                        style={[
                          styles.dayNameText,
                          day.isPast && { color: '#94a3b8' },
                        ]}
                      >
                        {day.fullDay}
                      </Text>
                      <Text
                        style={[
                          styles.dayDateText,
                          day.isPast && { color: '#cbd5e1' },
                        ]}
                      >
                        {day.label}
                      </Text>
                      {day.isPast && <Text style={styles.pastBadge}>Đã qua</Text>}
                    </View>

                    {/* Shifts for this day */}
                    <View style={styles.slotsCol}>
                      {SHIFT_TYPES.map((st) => {
                        const key = `${day.iso}|${st.key}`;
                        const isExisting = existingMap.has(key);
                        const isDisabled = day.isPast || isExisting;
                        const isSelected = selectedSlots.has(key);

                        return (
                          <TouchableOpacity
                            key={st.key}
                            style={[
                              styles.slotBtn,
                              isDisabled && styles.slotBtnDisabled,
                              isSelected && styles.slotBtnSelected,
                              isExisting && styles.slotBtnExisting,
                            ]}
                            onPress={() => toggleSlot(day.iso, st.key, isDisabled)}
                            disabled={isDisabled}
                          >
                            <View style={styles.slotBtnContent}>
                              <Text
                                style={[
                                  styles.slotBtnLabel,
                                  isSelected && styles.slotBtnLabelSelected,
                                  isExisting && styles.slotBtnLabelExisting,
                                  day.isPast && { color: '#94a3b8' },
                                ]}
                              >
                                {st.label}
                              </Text>
                              <Text
                                style={[
                                  styles.slotBtnTime,
                                  isSelected && { color: '#bfdbfe' },
                                ]}
                              >
                                {st.time.split(' - ')[0]}
                              </Text>
                              {isExisting && (
                                <Text style={styles.existingTag}>Đã có</Text>
                              )}
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={16}
                                  color="#ffffff"
                                  style={styles.selectedIcon}
                                />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Inputs: Số bệnh nhân tối đa & Ghi chú */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số bệnh nhân tối đa cho mỗi ca</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={maxPatients}
                  onChangeText={setMaxPatients}
                  placeholder="10"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú (tuỳ chọn)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={2}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ghi chú áp dụng cho các ca đã chọn (tuỳ chọn)"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Repeat Weekly Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRepeatWeekly(!repeatWeekly)}
              >
                <Ionicons
                  name={repeatWeekly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={repeatWeekly ? colors.primary : '#94a3b8'}
                />
                <Text style={styles.checkboxLabel}>
                  Áp dụng các ca đã chọn cho các tuần tiếp theo
                </Text>
              </TouchableOpacity>

              {repeatWeekly && (
                <View style={styles.repeatCountRow}>
                  <Text style={styles.repeatCountText}>Lặp lại trong:</Text>
                  {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.repeatPill,
                        repeatCount === num && styles.repeatPillActive,
                      ]}
                      onPress={() => setRepeatCount(num)}
                    >
                      <Text
                        style={[
                          styles.repeatPillText,
                          repeatCount === num && styles.repeatPillTextActive,
                        ]}
                      >
                        {num} tuần
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions (Hủy / Đăng ký) */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={submitting}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnSubmit,
                (selectedSlots.size === 0 || submitting) && styles.btnSubmitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={selectedSlots.size === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnSubmitText}>
                  Đăng ký ({selectedSlots.size} ca)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  warningNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weekNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  currentWeekTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentWeekText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  matrixContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayRowPast: {
    opacity: 0.6,
  },
  dayInfoCol: {
    width: 82,
    justifyContent: 'center',
  },
  dayNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dayDateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  pastBadge: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 2,
  },
  slotsCol: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  slotBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  slotBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  slotBtnExisting: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  slotBtnSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  slotBtnContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  slotBtnLabelSelected: {
    color: '#ffffff',
  },
  slotBtnLabelExisting: {
    color: '#15803d',
  },
  slotBtnTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  existingTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  selectedIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  repeatCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 30,
    marginTop: 4,
  },
  repeatCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  repeatPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  repeatPillActive: {
    backgroundColor: colors.primary,
  },
  repeatPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  repeatPillTextActive: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  btnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  btnSubmit: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSubmitDisabled: {
    backgroundColor: '#93c5fd',
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
