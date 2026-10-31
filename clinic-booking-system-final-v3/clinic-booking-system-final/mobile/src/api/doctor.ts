import { apiClient } from './client';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface DoctorShiftItem {
  id: number;
  doctorId: number;
  doctorName?: string;
  specialtyName?: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  maxPatients: number;
  note?: string;
}

export interface DoctorAppointmentItem {
  id: number;
  reason?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm:ss
  appointmentNo?: string;
  createdAt?: string;
  status:
    | 'PENDING_CONFIRMATION'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'RESCHEDULED';
  patientName: string;
  doctorName?: string;
  doctorId?: number;
  specialtyName?: string;
  meetingUrl?: string;
  type?: 'ONLINE' | 'OFFLINE';
  phoneNumber?: string;
  patientId?: number;
  shiftId?: number;
}

export interface CreateShiftPayload {
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  maxPatients?: number;
  note?: string;
  repeatWeekly?: boolean;
  repeatCount?: number;
}

export interface DoctorDashboardMetrics {
  totalAppointments: number;
  completedPatients: number;
  inProgressAndWaiting: number;
  totalShifts: number;
  todayAppointments: number;
  todaySchedule: DoctorAppointmentItem[];
}

export const doctorApi = {
  // Lấy danh sách ca làm việc của bác sĩ
  async getMyShifts(week?: string): Promise<DoctorShiftItem[]> {
    try {
      const url = week ? `/shifts/my?week=${week}` : '/shifts/my';
      const res = await apiClient.get(url);
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('Error fetching doctor shifts:', e);
      return [];
    }
  },

  // Đăng ký ca làm việc mới
  async createShift(payload: CreateShiftPayload): Promise<any> {
    const res = await apiClient.post('/shifts/create', payload);
    return res.data;
  },

  // Lấy danh sách lịch hẹn theo từng ca trực
  async getAppointmentsByShift(shiftId: number): Promise<DoctorAppointmentItem[]> {
    try {
      const res = await apiClient.get(`/appointments/by-shift/${shiftId}`);
      const list = res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map((apt: any) => ({
        ...apt,
        shiftId,
      }));
    } catch (e) {
      console.error(`Error fetching appointments for shift ${shiftId}:`, e);
      return [];
    }
  },

  // Lấy toàn bộ lịch hẹn của bác sĩ dựa trên các ca làm việc
  async getAllDoctorAppointments(): Promise<DoctorAppointmentItem[]> {
    try {
      const shifts = await this.getMyShifts();
      if (!shifts || shifts.length === 0) return [];

      const promises = shifts.map((s) => this.getAppointmentsByShift(s.id));
      const results = await Promise.all(promises);

      const all: DoctorAppointmentItem[] = [];
      const seenIds = new Set<number>();

      for (const batch of results) {
        for (const item of batch) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            all.push(item);
          }
        }
      }

      // Sắp xếp ngày giảm dần, giờ giảm dần
      all.sort((a, b) => {
        const dateDiff = b.appointmentDate.localeCompare(a.appointmentDate);
        if (dateDiff !== 0) return dateDiff;
        return (b.appointmentTime || '').localeCompare(a.appointmentTime || '');
      });

      return all;
    } catch (e) {
      console.error('Error fetching all doctor appointments:', e);
      return [];
    }
  },

  // Bác sĩ bắt đầu khám
  async startAppointment(id: number): Promise<void> {
    await apiClient.put(`/appointments/start/${id}`);
  },

  // Bác sĩ hoàn tất khám
  async completeAppointment(id: number): Promise<void> {
    await apiClient.put(`/appointments/complete/${id}`);
  },

  // Lấy số liệu thống kê tổng quan (Dashboard metrics)
  async getDashboardMetrics(): Promise<DoctorDashboardMetrics> {
    const today = new Date().toISOString().split('T')[0];

    const [shifts, allAppointments] = await Promise.all([
      this.getMyShifts(),
      this.getAllDoctorAppointments(),
    ]);

    // Bệnh nhân đã khám (COMPLETED)
    const completedApts = allAppointments.filter((a) => a.status === 'COMPLETED');

    // Bệnh nhân đang khám hoặc chuẩn bị tới lượt (IN_PROGRESS, CHECKED_IN)
    const inProgressAndWaitingApts = allAppointments.filter(
      (a) => a.status === 'IN_PROGRESS' || a.status === 'CHECKED_IN'
    );

    // Lịch hẹn hôm nay
    const todayApts = allAppointments.filter((a) => a.appointmentDate === today);

    // Lịch khám hôm nay (sắp xếp tăng dần theo giờ)
    const todaySchedule = [...todayApts].sort((a, b) =>
      (a.appointmentTime || '').localeCompare(b.appointmentTime || '')
    );

    return {
      totalAppointments: allAppointments.length,
      completedPatients: completedApts.length,
      inProgressAndWaiting: inProgressAndWaitingApts.length,
      totalShifts: shifts.length,
      todayAppointments: todayApts.length,
      todaySchedule,
    };
  },
};
