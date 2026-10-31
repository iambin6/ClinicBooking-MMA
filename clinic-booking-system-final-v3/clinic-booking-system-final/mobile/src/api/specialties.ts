import { apiClient } from './client';
import { Specialty } from '../types';

export const specialtyApi = {
  async getSpecialties(): Promise<Specialty[]> {
    try {
      const res = await apiClient.get('/specialties/all');
      const data = res.data?.data || res.data || [];
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: Number(item.id || 0),
        name: String(item.name || ''),
        description: String(item.description || ''),
      }));
    } catch (e) {
      console.error('Error fetching specialties:', e);
      return [];
    }
  },
};
