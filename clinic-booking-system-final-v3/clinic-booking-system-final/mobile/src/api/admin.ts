import { apiClient } from './client';

export interface AdminUserItem {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  isEnable?: boolean;
  role?: string;
  userType?: string;
  specialtyName?: string;
  specialization?: string;
  specialtyId?: number;
  degree?: string;
  experience?: string;
  description?: string;
}

export interface AdminSpecialtyItem {
  id: number;
  name: string;
  description: string;
  doctorCount?: number;
}

export interface AdminShiftItem {
  id: number;
  date: string; // YYYY-MM-DD
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING';
  doctorId: number;
  doctorName: string;
  specialtyName?: string;
}

export interface CreateUserPayload {
  userType: 'Doctor' | 'Receptionist' | 'Patient' | 'Admin';
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
  specialtyId?: number;
  specialization?: string;
  degree?: string;
  experience?: string;
  description?: string;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
  degree?: string;
  experience?: string;
  description?: string;
  specialtyId?: number;
  specialization?: string;
}

export interface UpdateReceptionistPayload {
  fullName?: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
}

export const adminApi = {
  // Lấy thống kê tổng quan (Dashboard)
  async getDashboardStats() {
    const [usersRes, docsRes, recepRes] = await Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/admin/doctors'),
      apiClient.get('/admin/receptionists'),
    ]);

    const users: AdminUserItem[] = usersRes.data?.data || usersRes.data || [];
    const rawDoctors: any[] = docsRes.data?.data || docsRes.data || [];
    const receptionists: AdminUserItem[] = recepRes.data?.data || recepRes.data || [];

    const doctors: AdminUserItem[] = rawDoctors.map((d) => ({
      ...d,
      specialtyName: d.specialtyName || d.specialization || d.specialty?.name || '',
    }));

    const doctorIds = new Set(doctors.map((d) => d.id));
    const receptionistIds = new Set(receptionists.map((r) => r.id));

    const enhancedUsers = users.map((u) => {
      let role = 'Patient / Other';
      if (doctorIds.has(u.id)) role = 'Doctor';
      else if (receptionistIds.has(u.id)) role = 'Receptionist';
      return { ...u, role };
    });

    return {
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalReceptionists: receptionists.length,
      recentUsers: enhancedUsers.slice(0, 8),
      featuredDoctors: doctors.slice(0, 8),
    };
  },

  // Người dùng
  async getAllUsers(): Promise<AdminUserItem[]> {
    const res = await apiClient.get('/admin/users');
    const list = res.data?.data || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async createUser(payload: CreateUserPayload): Promise<any> {
    const res = await apiClient.post('/admin/create-user', payload);
    return res.data;
  },

  // Bác sĩ
  async getAllDoctors(): Promise<AdminUserItem[]> {
    const res = await apiClient.get('/admin/doctors');
    const list = res.data?.data || res.data || [];
    if (!Array.isArray(list)) return [];
    return list.map((doc: any) => ({
      ...doc,
      specialtyName: doc.specialtyName || doc.specialization || doc.specialty?.name || '',
      specialization: doc.specialization || doc.specialtyName || doc.specialty?.name || '',
    }));
  },

  async updateDoctor(id: number, payload: UpdateDoctorPayload): Promise<any> {
    const res = await apiClient.put(`/admin/update-doctor/${id}`, payload);
    return res.data;
  },

  // Lễ tân
  async getAllReceptionists(): Promise<AdminUserItem[]> {
    const res = await apiClient.get('/admin/receptionists');
    const list = res.data?.data || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async updateReceptionist(id: number, payload: UpdateReceptionistPayload): Promise<any> {
    const res = await apiClient.put(`/admin/update-receptionist/${id}`, payload);
    return res.data;
  },

  // Chuyên khoa
  async getAllSpecialties(): Promise<AdminSpecialtyItem[]> {
    const res = await apiClient.get('/specialties/all');
    const list = res.data?.data || res.data || [];
    return Array.isArray(list) ? list : [];
  },

  async createSpecialty(payload: { name: string; description: string }): Promise<any> {
    const res = await apiClient.post('/specialties/create', payload);
    return res.data;
  },

  async updateSpecialty(id: number, payload: { name: string; description: string }): Promise<any> {
    const res = await apiClient.put(`/specialties/update/${id}`, payload);
    return res.data;
  },

  async deleteSpecialty(id: number): Promise<any> {
    const res = await apiClient.delete(`/specialties/delete/${id}`);
    return res.data;
  },

  // Lịch trực của tất cả bác sĩ theo tuần (Image 4)
  async getShiftsInWeek(startISO: string, endISO: string): Promise<AdminShiftItem[]> {
    const res = await apiClient.get(
      `/shifts/admin/week?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
    );
    const list = res.data?.data || res.data || [];
    return Array.isArray(list) ? list : [];
  },
};
