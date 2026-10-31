import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { specialtyApi } from '../api/specialties';
import { doctorApi } from '../api/doctors';
import { Specialty, Doctor } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [specData, docData] = await Promise.all([
      specialtyApi.getSpecialties(),
      doctorApi.getAllDoctors(),
    ]);
    setSpecialties(specData);
    setDoctors(docData.slice(0, 5)); // Take top 5
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.userName}>{user?.fullName || 'Khách'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('AppointmentsTab')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>Phòng khám Đa khoa Quốc tế</Text>
            <Text style={styles.heroTitle}>Chăm sóc sức khỏe toàn diện cho gia đình bạn</Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate('BookingModal')}
            >
              <Text style={styles.heroButtonText}>Đặt lịch khám ngay</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('BookingModal')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="calendar" size={26} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Đặt lịch khám</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('ChatbotTab')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#d97706" />
            </View>
            <Text style={styles.actionLabel}>Trợ lý AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('DoctorsTab')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="medkit" size={26} color="#16a34a" />
            </View>
            <Text style={styles.actionLabel}>Tìm Bác sĩ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('AppointmentsTab')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="time" size={26} color="#9333ea" />
            </View>
            <Text style={styles.actionLabel}>Lịch sử khám</Text>
          </TouchableOpacity>
        </View>

        {/* Specialties */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chuyên khoa</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorsTab')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesList}>
          {specialties.length === 0 ? (
            <Text style={styles.emptyText}>Đang tải danh sách chuyên khoa...</Text>
          ) : (
            specialties.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.specialtyChip}
                onPress={() => navigation.navigate('DoctorsTab', { specialtyId: item.id })}
              >
                <View style={styles.specialtyIconBox}>
                  <Ionicons name="pulse" size={20} color={colors.primary} />
                </View>
                <Text style={styles.specialtyName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Top Doctors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bác sĩ nổi bật</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorsTab')}>
            <Text style={styles.seeAllText}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.doctorsList}>
          {doctors.length === 0 ? (
            <Text style={styles.emptyText}>Đang cập nhật danh sách bác sĩ...</Text>
          ) : (
            doctors.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.doctorCard}
                onPress={() => navigation.navigate('DoctorDetail', { doctorId: doc.id })}
              >
                <View style={styles.doctorAvatar}>
                  <Ionicons name="person" size={32} color={colors.primary} />
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>BS. {doc.fullName}</Text>
                  <Text style={styles.doctorSpecialty}>
                    {doc.specialtyName || 'Chuyên khoa Nội'}
                  </Text>
                  {doc.degree && <Text style={styles.doctorDegree}>{doc.degree}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.bookSmallBtn}
                  onPress={() => navigation.navigate('BookingModal', { doctorId: doc.id })}
                >
                  <Text style={styles.bookSmallText}>Đặt hẹn</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroContent: {
    gap: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 24,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 6,
  },
  heroButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  specialtiesList: {
    paddingLeft: 20,
  },
  specialtyChip: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
  },
  specialtyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    paddingHorizontal: 20,
    color: colors.textMuted,
    fontSize: 14,
  },
  doctorsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  doctorDegree: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookSmallBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookSmallText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
