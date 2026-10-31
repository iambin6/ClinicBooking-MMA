import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi, DoctorDashboardMetrics, DoctorAppointmentItem } from '../../api/doctor';
import { useNavigation } from '@react-navigation/native';

export default function DoctorOverviewScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [metrics, setMetrics] = useState<DoctorDashboardMetrics>({
    totalAppointments: 0,
    completedPatients: 0,
    inProgressAndWaiting: 0,
    totalShifts: 0,
    todayAppointments: 0,
    todaySchedule: [],
  });

  const loadData = useCallback(async () => {
    try {
      const data = await doctorApi.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartAppointment = async (apt: DoctorAppointmentItem) => {
    try {
      setUpdatingId(apt.id);
      await doctorApi.startAppointment(apt.id);
      Alert.alert('Thành công', `Đã bắt đầu buổi khám cho bệnh nhân ${apt.patientName}`);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể bắt đầu ca khám');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteAppointment = async (apt: DoctorAppointmentItem) => {
    try {
      setUpdatingId(apt.id);
      await doctorApi.completeAppointment(apt.id);
      Alert.alert('Thành công', `Đã hoàn tất ca khám cho bệnh nhân ${apt.patientName}`);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể hoàn tất ca khám');
    } finally {
      setUpdatingId(null);
    }
  };

  // Format today date in Vietnamese: "Thứ Bảy, 31 tháng 10, 2026"
  const getFormattedToday = () => {
    const now = new Date();
    const days = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${dayName}, ${date} tháng ${month}, ${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return { label: 'Đã đến', bg: '#f3e8ff', text: '#7e22ce', dot: '#9333ea' };
      case 'IN_PROGRESS':
        return { label: 'Đang khám', bg: '#cffafe', text: '#0e7490', dot: '#06b6d4' };
      case 'COMPLETED':
        return { label: 'Đã khám', bg: '#dcfce7', text: '#15803d', dot: '#22c55e' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' };
      case 'PENDING_CONFIRMATION':
        return { label: 'Chờ xác nhận', bg: '#e0e7ff', text: '#4338ca', dot: '#6366f1' };
      default:
        return { label: status, bg: '#f1f5f9', text: '#475569', dot: '#64748b' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'B'}
            </Text>
          </View>
          <View>
            <Text style={styles.doctorGreeting}>Chào mừng bác sĩ,</Text>
            <Text style={styles.doctorName}>{user?.fullName || 'Bác sĩ'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AppointmentsDoctorTab')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Đăng xuất',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  },
                },
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>Tổng quan</Text>
          <Text style={styles.subtitle}>
            Chào mừng trở lại! Đây là tổng quan hoạt động của bạn.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải thống kê...</Text>
          </View>
        ) : (
          <>
            {/* Metric Cards Grid */}
            <View style={styles.metricsGrid}>
              {/* Card 1: Tổng số lịch hẹn */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="calendar" size={22} color="#2563eb" />
                </View>
                <Text style={styles.metricValue}>{metrics.totalAppointments}</Text>
                <Text style={styles.metricLabel}>Tổng số lịch hẹn</Text>
              </View>

              {/* Card 2: Bệnh nhân đã khám */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="checkmark-done-circle" size={24} color="#16a34a" />
                </View>
                <Text style={styles.metricValue}>{metrics.completedPatients}</Text>
                <Text style={styles.metricLabel}>Đã khám xong</Text>
              </View>

              {/* Card 3: Đang khám & chuẩn bị tới lượt */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#ecfeff' }]}>
                  <Ionicons name="people" size={22} color="#0891b2" />
                </View>
                <Text style={styles.metricValue}>{metrics.inProgressAndWaiting}</Text>
                <Text style={styles.metricLabel}>Đang & Sắp khám</Text>
              </View>

              {/* Card 4: Tổng số ca đã đăng ký */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#f0fdfa' }]}>
                  <Ionicons name="time" size={22} color="#0d9488" />
                </View>
                <Text style={styles.metricValue}>{metrics.totalShifts}</Text>
                <Text style={styles.metricLabel}>Tổng số ca trực</Text>
              </View>

              {/* Card 5: Lịch hẹn hôm nay (Chiếm full width) */}
              <View style={[styles.metricCard, styles.metricCardFull]}>
                <View style={styles.fullCardRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#fffbeb' }]}>
                    <Ionicons name="today" size={24} color="#d97706" />
                  </View>
                  <View style={{ marginLeft: 14 }}>
                    <Text style={styles.metricLabel}>Lịch hẹn hôm nay</Text>
                    <Text style={[styles.metricValue, { color: '#d97706' }]}>
                      {metrics.todayAppointments} cuộc hẹn
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Today Appointments Section */}
            <View style={styles.todayCardWrapper}>
              <View style={styles.todayHeaderBanner}>
                <View style={styles.bannerRow}>
                  <Ionicons name="calendar-outline" size={18} color="#ffffff" />
                  <Text style={styles.todayBannerTitle}>Lịch khám hôm nay</Text>
                </View>
                <Text style={styles.todayBannerDate}>{getFormattedToday()}</Text>
              </View>

              <View style={styles.todayBody}>
                {metrics.todaySchedule.length === 0 ? (
                  <View style={styles.emptyTodayBox}>
                    <Ionicons name="calendar-clear-outline" size={44} color="#94a3b8" />
                    <Text style={styles.emptyTodayText}>
                      Không có lịch khám nào hôm nay
                    </Text>
                  </View>
                ) : (
                  metrics.todaySchedule.map((apt) => {
                    const badge = getStatusBadge(apt.status);
                    const isUpdating = updatingId === apt.id;

                    return (
                      <View key={apt.id} style={styles.aptItem}>
                        <View style={styles.aptHeaderRow}>
                          <View style={styles.aptTimeBox}>
                            <Ionicons name="time-outline" size={14} color="#2563eb" />
                            <Text style={styles.aptTimeText}>
                              {apt.appointmentTime?.slice(0, 5) || 'Trong ngày'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.aptStatusBadge,
                              { backgroundColor: badge.bg },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: badge.dot },
                              ]}
                            />
                            <Text style={[styles.statusText, { color: badge.text }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.aptPatientInfo}>
                          <Text style={styles.patientName}>{apt.patientName}</Text>
                          {apt.reason ? (
                            <Text style={styles.patientReason} numberOfLines={2}>
                              Lý do: {apt.reason}
                            </Text>
                          ) : null}
                          {apt.type && (
                            <Text style={styles.typeTag}>
                              {apt.type === 'ONLINE' ? '🌐 Khám Online' : '🏥 Khám Trực tiếp'}
                            </Text>
                          )}
                        </View>

                        {/* Doctor Action Buttons */}
                        <View style={styles.actionRow}>
                          {apt.status === 'CHECKED_IN' && (
                            <TouchableOpacity
                              style={[styles.btnAction, styles.btnStart]}
                              onPress={() => handleStartAppointment(apt)}
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
                              onPress={() => handleCompleteAppointment(apt)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Ionicons name="checkmark-done" size={14} color="#fff" />
                                  <Text style={styles.btnActionText}>Hoàn thành</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284c7',
  },
  doctorGreeting: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricCardFull: {
    width: '100%',
  },
  fullCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  todayCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  todayHeaderBanner: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  todayBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  todayBannerDate: {
    fontSize: 12,
    color: '#dbeafe',
  },
  todayBody: {
    padding: 16,
  },
  emptyTodayBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTodayText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
  },
  aptItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aptTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aptTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  aptStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aptPatientInfo: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  patientReason: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  typeTag: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
