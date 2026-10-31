import { apiClient } from './client';
import { Doctor, DoctorShift } from '../types';

function normalizeDoctor(raw: any): Doctor {
  if (!raw) return { id: 0, fullName: '' };

  const specialtyRaw = raw.specialty || (Array.isArray(raw.specialities) ? raw.specialities[0] : null);

  const specialtyId =
    typeof raw.specialtyId === 'number'
      ? raw.specialtyId
      : typeof specialtyRaw?.id === 'number'
      ? specialtyRaw.id
      : undefined;

  const specialtyName =
    typeof raw.specialtyName === 'string'
      ? raw.specialtyName
      : typeof specialtyRaw?.name === 'string'
      ? specialtyRaw.name
      : typeof raw.specialization === 'string'
      ? raw.specialization
      : undefined;

  return {
    id: Number(raw.id || 0),
    fullName: raw.fullName || raw.name || '',
    email: raw.email,
    phoneNumber: raw.phoneNumber,
    gender: raw.gender,
    degree: raw.degree,
    description: raw.description,
    experience: raw.experience,
    specialtyId,
    specialtyName,
    avatarUrl: raw.avatarUrl || raw.imageUrl || raw.photoUrl || raw.profileImage,
  };
}

export const doctorApi = {
  async getAllDoctors(): Promise<Doctor[]> {
    try {
      const res = await apiClient.get('/admin/doctors');
      const list = res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeDoctor);
    } catch (e) {
      console.error('Error fetching doctors:', e);
      return [];
    }
  },

  async getDoctorsBySpecialty(specialtyId: number): Promise<Doctor[]> {
    try {
      const res = await apiClient.get(`/doctors/by-specialty/${specialtyId}`);
      const list = res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeDoctor);
    } catch (e) {
      console.error('Error fetching doctors by specialty:', e);
      return [];
    }
  },

  async getDoctorById(id: number): Promise<Doctor | null> {
    try {
      const res = await apiClient.get(`/doctors/${id}`);
      return normalizeDoctor(res.data?.data || res.data);
    } catch (e) {
      console.error(`Error fetching doctor ${id}:`, e);
      return null;
    }
  },

  async getDoctorShifts(doctorId: number, dateISO: string): Promise<DoctorShift[]> {
    try {
      const res = await apiClient.get(`/shifts/by-doctor/${doctorId}?date=${encodeURIComponent(dateISO)}`);
      const list = res.data?.data || res.data || [];
      if (!Array.isArray(list)) return [];
      return list.map((item: any) => ({
        id: Number(item.id || 0),
        shiftDate: item.date || item.shiftDate || dateISO,
        shiftName: item.shift || item.shiftName || 'Ca khám',
        startTime: item.startTime || item.start || '08:00',
        endTime: item.endTime || item.end || '11:30',
        doctorId: Number(item.doctorId || doctorId),
        doctorName: item.doctorName,
        slots: item.slots || [],
      }));
    } catch (e) {
      console.error('Error fetching doctor shifts:', e);
      return [];
    }
  },
};
