export type UserType = 'Guest' | 'Patient' | 'Doctor' | 'Receptionist' | 'Admin';

export interface User {
  id: string | number;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  userType: UserType;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
}

export interface Doctor {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
  degree?: string;
  description?: string;
  experience?: string;
  specialtyId?: number;
  specialtyName?: string;
  imageUrl?: string;
  avatarUrl?: string;
}

export interface ShiftSlot {
  id: number;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  maxCapacity?: number;
  currentBookings?: number;
}

export interface DoctorShift {
  id: number;
  shiftDate: string; // YYYY-MM-DD
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  doctorId: number;
  doctorName?: string;
  slots?: ShiftSlot[];
}

export interface Appointment {
  id: number;
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // HH:mm
  appointmentNo?: string;
  createdAt?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  patientName?: string;
  doctorName?: string;
  doctorId?: number;
  specialtyName?: string;
  reason?: string;
  type?: 'ONLINE' | 'OFFLINE';
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isError?: boolean;
}
