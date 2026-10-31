import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { specialtyApi } from '../api/specialties';
import { doctorApi } from '../api/doctors';
import { appointmentApi } from '../api/appointments';
import { Specialty, Doctor, DoctorShift } from '../types';

export default function BookingScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const preSelectedDoctorId = route?.params?.doctorId;
  const preSelectedSpecialtyId = route?.params?.specialtyId;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Specialty & Doctor
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(preSelectedSpecialtyId || null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(preSelectedDoctorId || null);

  // Step 2: Date & Shift
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableShifts, setAvailableShifts] = useState<DoctorShift[]>([]);
  const [selectedShift, setSelectedShift] = useState<DoctorShift | null>(null);

  // Step 3: Patient Information
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');

  // Load Initial Data
  useEffect(() => {
    specialtyApi.getSpecialties().then(setSpecialties);
    doctorApi.getAllDoctors().then(setDoctors);
  }, []);

  // When Doctor is selected, load available shifts
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoading(true);
      doctorApi
        .getDoctorShifts(selectedDoctor, selectedDate)
        .then((shifts) => {
          setAvailableShifts(shifts);
          if (shifts.length > 0) setSelectedShift(shifts[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedDoctor, selectedDate]);

  // Handle auto-matching doctor specialty
  useEffect(() => {
    if (selectedDoctor && !selectedSpecialty) {
      const doc = doctors.find((d) => d.id === selectedDoctor);
      if (doc?.specialtyId) setSelectedSpecialty(doc.specialtyId);
    }
  }, [selectedDoctor, doctors]);

  const filteredDoctors = selectedSpecialty
    ? doctors.filter((d) => d.specialtyId === selectedSpecialty)
    : doctors;

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedDoctor) {
        Alert.alert('Vui lòng chọn', 'Hãy chọn bác sĩ khám bệnh để tiếp tục.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedShift) {
        Alert.alert('Vui lòng chọn', 'Hãy chọn một ca khám còn trống.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!fullName.trim() || !phoneNumber.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại liên hệ.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedShift) return;
    setSubmitting(true);
    try {
      const result = await appointmentApi.bookAppointment({
        specialtyId: selectedSpecialty || 1,
        doctorId: selectedDoctor,
        shiftId: selectedShift.id,
        dateISO: selectedDate,
        reason: reason || 'Khám tổng quát',
        type: appointmentType,
        patient: {
          fullName,
          gender,
          phoneNumber,
        },
      });

      Alert.alert(
        'Đặt lịch thành công! 🎉',
        `Lịch khám #${result.appointmentNo || result.id} đã được tạo thành công. Vui lòng theo dõi trạng thái tại mục Lịch khám.`,
        [
          {
            text: 'Xem lịch hẹn',
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'AppointmentsTab' });
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Đặt lịch thất bại', e.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate 7 upcoming dates
  const nextDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Th ${d.getDay() + 1}`;
    const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
    return { iso, dayName, dateFormatted };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <Text style={styles.stepIndicator}>{currentStep}/4</Text>
      </View>

      {/* Step Progress Bar */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[styles.progressSegment, currentStep >= step && styles.progressSegmentActive]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================= STEP 1: SELECT SPECIALTY & DOCTOR ================= */}
        {currentStep === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>1. Chọn Chuyên khoa & Bác sĩ</Text>

            <Text style={styles.fieldLabel}>Chuyên khoa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {specialties.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.chip,
                    selectedSpecialty === s.id && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedSpecialty(s.id);
                    setSelectedDoctor(null);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSpecialty === s.id && styles.chipTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Bác sĩ phụ trách</Text>
            {filteredDoctors.length === 0 ? (
              <Text style={styles.emptyNotice}>Chưa có bác sĩ thuộc chuyên khoa này.</Text>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.doctorItem, isSelected && styles.doctorItemActive]}
                    onPress={() => setSelectedDoctor(doc.id)}
                  >
                    <View style={styles.doctorAvatar}>
                      <Ionicons name="person" size={26} color={isSelected ? colors.white : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, isSelected && { color: colors.white }]}>
                        BS. {doc.fullName}
                      </Text>
                      <Text style={[styles.docSpec, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                        {doc.specialtyName || 'Đa khoa'}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.white} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ================= STEP 2: DATE & SHIFT ================= */}
        {currentStep === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>2. Chọn Ngày & Ca khám</Text>

            <Text style={styles.fieldLabel}>Ngày khám</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
              {nextDates.map((item) => {
                const isSelected = selectedDate === item.iso;
                return (
                  <TouchableOpacity
                    key={item.iso}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                    onPress={() => setSelectedDate(item.iso)}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>
                      {item.dateFormatted}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Ca khám khả dụng</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : availableShifts.length === 0 ? (
              <View style={styles.noShiftBox}>
                <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
                <Text style={styles.noShiftText}>
                  Bác sĩ không có ca trực trong ngày đã chọn. Vui lòng chọn ngày khác.
                </Text>
              </View>
            ) : (
              <View style={styles.shiftGrid}>
                {availableShifts.map((shift) => {
                  const isSelected = selectedShift?.id === shift.id;
                  return (
                    <TouchableOpacity
                      key={shift.id}
                      style={[styles.shiftCard, isSelected && styles.shiftCardActive]}
                      onPress={() => setSelectedShift(shift)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={isSelected ? colors.white : colors.primary}
                      />
                      <Text style={[styles.shiftName, isSelected && { color: colors.white }]}>
                        {shift.shiftName}
                      </Text>
                      <Text style={[styles.shiftHours, isSelected && { color: 'rgba(255,255,255,0.85)' }]}>
                        {shift.startTime} - {shift.endTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Hình thức khám</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  appointmentType === 'OFFLINE' && styles.typeBtnActive,
                ]}
                onPress={() => setAppointmentType('OFFLINE')}
              >
                <Ionicons
                  name="business"
                  size={20}
                  color={appointmentType === 'OFFLINE' ? colors.white : colors.text}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    appointmentType === 'OFFLINE' && { color: colors.white },
                  ]}
                >
                  Tại phòng khám
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  appointmentType === 'ONLINE' && styles.typeBtnActive,
                ]}
                onPress={() => setAppointmentType('ONLINE')}
              >
                <Ionicons
                  name="videocam"
                  size={20}
                  color={appointmentType === 'ONLINE' ? colors.white : colors.text}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    appointmentType === 'ONLINE' && { color: colors.white },
                  ]}
                >
                  Tư vấn Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: PATIENT INFORMATION ================= */}
        {currentStep === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>3. Thông tin người bệnh</Text>

            <Text style={styles.fieldLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Số điện thoại liên hệ *</Text>
            <TextInput
              style={styles.input}
              placeholder="0912 345 678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Giới tính</Text>
            <View style={styles.genderRow}>
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Lý do khám / Triệu chứng</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả triệu chứng hoặc lý do cần khám..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
          </View>
        )}

        {/* ================= STEP 4: REVIEW & CONFIRM ================= */}
        {currentStep === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>4. Xác nhận thông tin hẹn khám</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bác sĩ</Text>
                <Text style={styles.summaryVal}>
                  BS. {doctors.find((d) => d.id === selectedDoctor)?.fullName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Chuyên khoa</Text>
                <Text style={styles.summaryVal}>
                  {specialties.find((s) => s.id === selectedSpecialty)?.name || 'Đa khoa'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ngày khám</Text>
                <Text style={styles.summaryVal}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ca trực</Text>
                <Text style={styles.summaryVal}>
                  {selectedShift?.shiftName} ({selectedShift?.startTime} - {selectedShift?.endTime})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hình thức</Text>
                <Text style={styles.summaryVal}>
                  {appointmentType === 'ONLINE' ? 'Tư vấn Online' : 'Tại phòng khám'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Người khám</Text>
                <Text style={styles.summaryVal}>{fullName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Điện thoại</Text>
                <Text style={styles.summaryVal}>{phoneNumber}</Text>
              </View>
              {reason ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Lý do</Text>
                  <Text style={styles.summaryVal}>{reason}</Text>
                </View>
              ) : null}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Chi phí dự kiến</Text>
                <Text style={styles.totalValue}>200.000 đ</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>Tiếp tục</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.success }]}
            onPress={handleConfirmBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Xác nhận & Hoàn tất</Text>
                <Ionicons name="checkmark-done" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 10,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  stepBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 12,
  },
  doctorItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  docSpec: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyNotice: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 10,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 72,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  dateTextActive: {
    color: colors.white,
  },
  shiftGrid: {
    gap: 10,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  shiftCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  shiftHours: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  noShiftBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noShiftText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  genderTextActive: {
    color: colors.white,
  },
  summaryCard: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
