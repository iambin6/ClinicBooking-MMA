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
import { adminApi, AdminUserItem } from '../../api/admin';
import { useNavigation } from '@react-navigation/native';

export default function AdminOverviewScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    recentUsers: [] as (AdminUserItem & { role?: string })[],
    featuredDoctors: [] as AdminUserItem[],
  });

  const loadData = useCallback(async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Error loading admin dashboard stats:', e);
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

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản Quản trị viên?', [
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.adminInfo}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield-checkmark" size={22} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.adminRole}>Quản trị viên hệ thống</Text>
            <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Tổng quan hệ thống</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu tổng quan...</Text>
          </View>
        ) : (
          <>
            {/* 3 Metric Cards as shown in Image 1 */}
            <View style={styles.statsRow}>
              {/* Card 1: Tổng người dùng */}
              <View style={[styles.statCard, { backgroundColor: '#e6f0ff' }]}>
                <Text style={styles.statLabel}>TỔNG NGƯỜI DÙNG</Text>
                <Text style={[styles.statValue, { color: '#1e40af' }]}>
                  {stats.totalUsers}
                </Text>
              </View>

              {/* Card 2: Bác sĩ */}
              <View style={[styles.statCard, { backgroundColor: '#fff4db' }]}>
                <Text style={styles.statLabel}>BÁC SĨ</Text>
                <Text style={[styles.statValue, { color: '#b45309' }]}>
                  {stats.totalDoctors}
                </Text>
              </View>

              {/* Card 3: Lễ tân */}
              <View style={[styles.statCard, { backgroundColor: '#e8f7ee' }]}>
                <Text style={styles.statLabel}>LỄ TÂN</Text>
                <Text style={[styles.statValue, { color: '#15803d' }]}>
                  {stats.totalReceptionists}
                </Text>
              </View>
            </View>

            {/* Section 1: Người dùng gần đây (Image 1) */}
            <View style={styles.cardSection}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionTitle}>Người dùng gần đây</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminDoctorsTab')}
                >
                  <Text style={styles.cardHeaderLink}>Tạo mới</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { flex: 1.2 }]}>Tên</Text>
                <Text style={[styles.thText, { flex: 1.6 }]}>Email</Text>
                <Text style={[styles.thText, { flex: 1 }]}>Số điện thoại</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Loại</Text>
              </View>

              {stats.recentUsers.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tdTextName, { flex: 1.2 }]} numberOfLines={1}>
                    {item.fullName || '—'}
                  </Text>
                  <Text style={[styles.tdText, { flex: 1.6 }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <Text style={[styles.tdText, { flex: 1 }]} numberOfLines={1}>
                    {item.phoneNumber || '—'}
                  </Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {item.role || 'Patient / Other'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Section 2: Bác sĩ nổi bật (Image 1) */}
            <View style={styles.cardSection}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionTitle}>Bác sĩ nổi bật</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminDoctorsTab')}
                >
                  <Text style={styles.cardHeaderLink}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { flex: 1.2 }]}>Tên</Text>
                <Text style={[styles.thText, { flex: 1 }]}>Chuyên khoa</Text>
                <Text style={[styles.thText, { flex: 1.8 }]}>Kinh nghiệm</Text>
              </View>

              {stats.featuredDoctors.map((doc) => (
                <View key={doc.id} style={styles.tableRow}>
                  <Text style={[styles.tdTextName, { flex: 1.2 }]} numberOfLines={1}>
                    {doc.fullName}
                  </Text>
                  <Text style={[styles.tdTextSpecialty, { flex: 1 }]} numberOfLines={1}>
                    {doc.specialtyName || 'Đa khoa'}
                  </Text>
                  <Text style={[styles.tdTextExp, { flex: 1.8 }]} numberOfLines={2}>
                    {doc.experience || '—'}
                  </Text>
                </View>
              ))}
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
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  adminRole: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  adminName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardHeaderLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  tdTextName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  tdText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: '#64748b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  tdTextSpecialty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  tdTextExp: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
  },
});
