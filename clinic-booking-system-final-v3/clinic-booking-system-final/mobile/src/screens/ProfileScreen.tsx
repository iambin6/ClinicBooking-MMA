import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { API_URL_KEY, DEFAULT_API_URL } from '../api/client';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [serverUrl, setServerUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(API_URL_KEY).then((url) => {
      setServerUrl(url || DEFAULT_API_URL || 'http://localhost:8080');
    });
  }, []);

  const saveServerUrl = async () => {
    try {
      await AsyncStorage.setItem(API_URL_KEY, serverUrl.trim());
      setEditingUrl(false);
      Alert.alert('Đã lưu!', 'Địa chỉ máy chủ Backend đã được cập nhật.');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName || 'Khách vãng lai'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Chưa đăng nhập'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.userType || 'Patient'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AppointmentsTab')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Lịch khám của tôi</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChatbotTab')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#d97706" />
            </View>
            <Text style={styles.menuLabel}>Trợ lý AI Gemini</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Server Setting */}
        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Cấu hình kết nối Backend</Text>
          <Text style={styles.sectionSubtitle}>
            Nếu chạy trên máy thật, đổi sang IP LAN máy tính của bạn (VD: http://192.168.1.x:8080)
          </Text>

          <TextInput
            style={[styles.input, !editingUrl && styles.inputDisabled]}
            value={serverUrl}
            onChangeText={setServerUrl}
            editable={editingUrl}
            placeholder="http://192.168.1.10:8080"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.serverActions}>
            {editingUrl ? (
              <TouchableOpacity style={styles.saveUrlBtn} onPress={saveServerUrl}>
                <Ionicons name="save-outline" size={16} color={colors.white} />
                <Text style={styles.saveUrlText}>Lưu địa chỉ</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editUrlBtn}
                onPress={() => setEditingUrl(true)}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.editUrlText}>Thay đổi IP Server</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Logout */}
        {user ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: colors.textSecondary,
  },
  serverActions: {
    alignItems: 'flex-end',
  },
  editUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editUrlText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  saveUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveUrlText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});
