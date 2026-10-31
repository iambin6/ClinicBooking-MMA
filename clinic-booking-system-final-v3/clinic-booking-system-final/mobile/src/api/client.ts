import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Current dynamic LAN IP of the development machine
export const CURRENT_LAN_IP = '192.168.1.65';
export const DEFAULT_API_URL = `http://${CURRENT_LAN_IP}:8080`;

export const TOKEN_KEY = 'clinic_auth_token';
export const USER_KEY = 'clinic_user_data';
export const API_URL_KEY = 'clinic_api_url';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to inject dynamic Base URL and JWT Bearer token into outgoing requests
apiClient.interceptors.request.use(async (config) => {
  try {
    let customBaseUrl = await AsyncStorage.getItem(API_URL_KEY);
    
    // Auto-migrate if holding outdated LAN IP
    if (customBaseUrl && customBaseUrl.includes('192.168.1.60')) {
      customBaseUrl = customBaseUrl.replace('192.168.1.60', CURRENT_LAN_IP);
      await AsyncStorage.setItem(API_URL_KEY, customBaseUrl);
    }

    config.baseURL = customBaseUrl || DEFAULT_API_URL;

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error attaching auth token', e);
  }
  return config;
});

// Response interceptor for unified error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Đã có lỗi xảy ra khi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);
