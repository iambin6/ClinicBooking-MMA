import { apiClient } from './client';
import { Appointment } from '../types';

export interface BookAppointmentInput {
  specialtyId: number;
  doctorId: number;
  shiftId: number;
  dateISO: string;
  reason?: string;
  type?: 'ONLINE' | 'OFFLINE';
  patient: {
    fullName: string;
    gender: 'Male' | 'Female' | 'Other';
    phoneNumber: string;
    dob?: string;
    relationship?: string;
  };
}

function normalizeAppointment(raw: any): Appointment {
  if (!raw) return { id: 0, status: 'PENDING' };

  const rawStatus = String(raw.status || '').toUpperCase();
  let status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
  if (rawStatus.includes('CONFIRM') || rawStatus.includes('APPROVED')) {
    status = 'CONFIRMED';
  } else if (rawStatus.includes('COMPLETE') || rawStatus.includes('DONE')) {
    status = 'COMPLETED';
  } else if (rawStatus.includes('CANCEL')) {
    status = 'CANCELLED';
  }

  return {
    id: Number(raw.id || 0),
    appointmentDate: raw.appointmentDate || raw.date,
    appointmentTime: raw.appointmentTime ? String(raw.appointmentTime).slice(0, 5) : undefined,
    appointmentNo: raw.appointmentNo,
    createdAt: raw.createdAt,
    status,
    patientName: raw.patientName || raw.patients?.[0]?.fullName,
    doctorName: raw.doctorName,
    doctorId: raw.doctorId,
    specialtyName: raw.specialtyName,
    reason: raw.reason,
    type: raw.type === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
  };
}

export const appointmentApi = {
  async bookAppointment(input: BookAppointmentInput): Promise<Appointment> {
    const payload = {
      appointment: {
        reason: input.reason || 'Khám bệnh',
        type: input.type || 'OFFLINE',
      },
      shiftId: input.shiftId,
      patients: [
        {
          fullName: input.patient.fullName,
          gender: input.patient.gender,
          phoneNumber: input.patient.phoneNumber,
          dob: input.patient.dob,
          relationship: input.patient.relationship || 'SELF',
        },
      ],
    };

    const res = await apiClient.post(
      `/appointments/create?specialtyId=${input.specialtyId}&doctorId=${input.doctorId}`,
      payload
    );

    const data = res.data?.data || res.data;
    return normalizeAppointment(data);
  },

  async getUpcomingAppointments(): Promise<Appointment[]> {
    try {
      const res = await apiClient.get('/appointments/my-upcoming');
      const list = res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeAppointment);
    } catch (e) {
      console.error('Error fetching upcoming appointments:', e);
      return [];
    }
  },

  async getCompletedAppointments(): Promise<Appointment[]> {
    try {
      const res = await apiClient.get('/appointments/my-completed');
      const list = res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeAppointment);
    } catch (e) {
      console.error('Error fetching completed appointments:', e);
      return [];
    }
  },

  async cancelAppointment(appointmentId: number, reason: string = 'Bệnh nhân bận việc'): Promise<boolean> {
    try {
      await apiClient.post(`/appointments/cancel/${appointmentId}`, { reason });
      return true;
    } catch (e) {
      console.error('Error cancelling appointment:', e);
      throw e;
    }
  },
};
