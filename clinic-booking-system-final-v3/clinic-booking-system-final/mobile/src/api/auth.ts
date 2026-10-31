import { apiClient, TOKEN_KEY, USER_KEY } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', payload);
    const backendData = res.data?.data;

    if (!backendData || !backendData.token) {
      throw new Error(res.data?.message || 'Đăng nhập không thành công');
    }

    const user: User = {
      id: String(backendData.id),
      fullName: backendData.fullName,
      email: payload.email,
      userType: backendData.role || 'Patient',
    };

    const token = backendData.token;

    // Persist to storage
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return { token, user };
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post('/auth/register', payload);
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },
};
