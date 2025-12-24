import { api } from './api.service';

export interface Availability {
  id?: number;
  provider_id?: number;
  weekday: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  start_time: string; // formato "HH:mm:ss"
  end_time: string; // formato "HH:mm:ss"
  active: boolean;
}

export interface SyncAvailabilitiesRequest {
  business_hours: Omit<Availability, 'id' | 'provider_id'>[];
}

export interface SyncAvailabilitiesResponse {
  message: string;
  data: Availability[];
}

/**
 * Service para gerenciar disponibilidades do profissional
 */
class AvailabilityService {
  /**
   * Listar disponibilidades de um profissional
   */
  async list(providerId: number | string): Promise<Availability[]> {
    const response = await api.get<any>(`/agenda/providers/${providerId}/availabilities`);
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Criar uma nova disponibilidade
   */
  async create(providerId: number | string, data: Omit<Availability, 'id' | 'provider_id'>): Promise<Availability> {
    const response = await api.post<any>(`/agenda/providers/${providerId}/availabilities`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Sincronizar múltiplas disponibilidades (cria ou atualiza conforme weekday)
   */
  async sync(providerId: number | string, data: SyncAvailabilitiesRequest): Promise<SyncAvailabilitiesResponse> {
    const response = await api.post<any>(`/agenda/providers/${providerId}/availabilities/sync`, data);
    return response.data;
  }

  /**
   * Atualizar uma disponibilidade
   */
  async update(
    providerId: number | string,
    id: number | string,
    data: Partial<Omit<Availability, 'id' | 'provider_id'>>
  ): Promise<Availability> {
    const response = await api.put<any>(`/agenda/providers/${providerId}/availabilities/${id}`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Deletar uma disponibilidade
   */
  async delete(providerId: number | string, id: number | string): Promise<void> {
    await api.delete(`/agenda/providers/${providerId}/availabilities/${id}`);
  }
}

export const availabilityService = new AvailabilityService();

