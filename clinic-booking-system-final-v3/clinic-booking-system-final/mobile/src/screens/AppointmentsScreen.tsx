import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { appointmentApi } from '../api/appointments';
import { Appointment } from '../types';

export default function AppointmentsScreen({ navigation }: any) {
  const [tab, setTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const [up, his] = await Promise.all([
        appointmentApi.getUpcomingAppointments(),
        appointmentApi.getCompletedAppointments(),
      ]);
      setUpcoming(up);
      setHistory(his);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleCancel = (appointmentId: number) => {
    Alert.alert(
      'Hủy lịch hẹn',
      'Bạn có chắc chắn muốn hủy lịch khám này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentApi.cancelAppointment(appointmentId);
              Alert.alert('Thành công', 'Đã hủy lịch hẹn khám.');
              loadAppointments();
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể hủy lịch khám.');
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: string) => {
    let bg = colors.warningLight;
    let text = colors.warning;
    let label = 'Chờ khám';

    if (status === 'CONFIRMED') {
      bg = colors.primaryLight;
      text = colors.primary;
      label = 'Đã xác nhận';
    } else if (status === 'COMPLETED') {
      bg = colors.successLight;
      text = colors.success;
      label = 'Đã hoàn tất';
    } else if (status === 'CANCELLED') {
      bg = colors.dangerLight;
      text = colors.danger;
      label = 'Đã hủy';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  const currentList = tab === 'UPCOMING' ? upcoming : history;

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.apptNoBox}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.apptNo}>Mã: #{item.appointmentNo || item.id}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.divider} />

      <View style={styles.docRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docName}>{item.doctorName ? `BS. ${item.doctorName}` : 'Bác sĩ chuyên khoa'}</Text>
          <Text style={styles.specName}>{item.specialtyName || 'Đa khoa'}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoValue}>{item.appointmentDate || 'Chưa xếp ngày'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoValue}>{item.appointmentTime || '08:00'}</Text>
        </View>
      </View>

      {item.patientName && (
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Bệnh nhân:</Text>
          <Text style={styles.patientName}>{item.patientName}</Text>
        </View>
      )}

      {item.reason ? (
        <View style={styles.reasonRow}>
          <Text style={styles.reasonLabel}>Lý do:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      ) : null}

      {tab === 'UPCOMING' && item.status !== 'CANCELLED' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelBtnText}>Hủy lịch</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn khám</Text>
      </View>

      {/* Segmented Controls */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'UPCOMING' && styles.tabBtnActive]}
          onPress={() => setTab('UPCOMING')}
        >
          <Text style={[styles.tabText, tab === 'UPCOMING' && styles.tabTextActive]}>
            Sắp tới ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'HISTORY' && styles.tabBtnActive]}
          onPress={() => setTab('HISTORY')}
        >
          <Text style={[styles.tabText, tab === 'HISTORY' && styles.tabTextActive]}>
            Lịch sử ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
              <Text style={styles.emptySub}>
                {tab === 'UPCOMING'
                  ? 'Bạn hiện không có lịch khám sắp tới nào.'
                  : 'Bạn chưa có lịch sử khám bệnh.'}
              </Text>
              {tab === 'UPCOMING' && (
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => navigation.navigate('BookingModal')}
                >
                  <Text style={styles.bookNowText}>Đặt lịch ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apptNoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apptNo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  specName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  patientRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  patientLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reasonRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  reasonLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  actionsRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cancelBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bookNowBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
