import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { API_URL_KEY, DEFAULT_API_URL } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server IP Modal Settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(API_URL_KEY).then((url) => {
      const activeUrl = url && !url.includes('192.168.1.60') ? url : DEFAULT_API_URL;
      setServerUrl(activeUrl);
      if (url && url.includes('192.168.1.60')) {
        AsyncStorage.setItem(API_URL_KEY, DEFAULT_API_URL);
      }
    });
  }, []);

  const handleSaveServerUrl = async () => {
    try {
      await AsyncStorage.setItem(API_URL_KEY, serverUrl.trim());
      setShowSettingsModal(false);
      Alert.alert('Thành công', `Đã cập nhật IP máy chủ thành:\n${serverUrl.trim()}`);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login({ email: cleanEmail, password: cleanPass });
      
      // Chuyển hướng theo vai trò (Admin -> AdminTabs, Bác sĩ -> DoctorTabs, Bệnh nhân -> MainTabs)
      let targetRoute = 'MainTabs';
      if (loggedInUser?.userType === 'Admin') {
        targetRoute = 'AdminTabs';
      } else if (loggedInUser?.userType === 'Doctor') {
        targetRoute = 'DoctorTabs';
      }

      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    } catch (e: any) {
      Alert.alert(
        'Đăng nhập thất bại',
        `${e.message}\n\n💡 Mẹo: Kiểm tra Backend đang chạy và IP máy chủ đang trỏ tới: ${serverUrl || DEFAULT_API_URL}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Settings button in top right */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="medical" size={40} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Phòng khám Đa khoa</Text>
            <Text style={styles.appTagline}>Đặt lịch khám & Chăm sóc sức khỏe trực tuyến</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Mật khẩu</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Fill Demo Roles */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Tài khoản mẫu:</Text>
              <View style={styles.demoBtnRow}>
                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: '#93c5fd', backgroundColor: '#eff6ff' }]}
                  onPress={() => {
                    setEmail('admin@clinicbooking.com');
                    setPassword('123456');
                  }}
                >
                  <Ionicons name="shield-checkmark" size={13} color="#2563eb" />
                  <Text style={[styles.demoChipText, { color: '#2563eb' }]}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}
                  onPress={() => {
                    setEmail('bacsi.demo01@example.com');
                    setPassword('123456');
                  }}
                >
                  <Ionicons name="medkit" size={13} color="#16a34a" />
                  <Text style={[styles.demoChipText, { color: '#16a34a' }]}>Bác sĩ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }]}
                  onPress={() => {
                    setEmail('miraisan2512@gmail.com');
                    setPassword('123456');
                  }}
                >
                  <Ionicons name="person" size={13} color="#475569" />
                  <Text style={[styles.demoChipText, { color: '#475569' }]}>Bệnh nhân</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Guest Mode */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleContinueAsGuest}
          >
            <Text style={styles.guestBtnText}>Tiếp tục khám phá với tư cách Khách</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Cấu hình IP Server */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cấu hình kết nối Backend</Text>
            <Text style={styles.modalDesc}>
              Địa chỉ IP máy tính đang chạy Spring Boot:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.65:8080"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <View style={styles.quickIpRow}>
              <TouchableOpacity
                style={styles.quickIpBtn}
                onPress={() => setServerUrl('http://192.168.1.65:8080')}
              >
                <Text style={styles.quickIpText}>Dùng IP LAN (192.168.1.65)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickIpBtn}
                onPress={() => setServerUrl('http://10.0.2.2:8080')}
              >
                <Text style={styles.quickIpText}>Dùng 10.0.2.2</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalSaveText}>Lưu cấu hình</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  appTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
    padding: 12,
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  quickIpRow: {
    gap: 6,
    marginBottom: 18,
  },
  quickIpBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickIpText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: colors.white,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
