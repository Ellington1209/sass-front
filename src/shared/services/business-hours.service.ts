import { api } from './api.service';

export interface BusinessHour {
  id?: number;
  tenant_id?: number;
  weekday: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  start_time: string; // formato "HH:mm:ss"
  end_time: string; // formato "HH:mm:ss"
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SyncBusinessHoursRequest {
  business_hours: Omit<BusinessHour, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[];
}

export interface SyncBusinessHoursResponse {
  message: string;
  data: BusinessHour[];
}

/**
 * Service para gerenciar horários de funcionamento do tenant
 */
class BusinessHoursService {
  /**
   * Listar horários de funcionamento de um tenant
   */
  async list(tenantId: number | string): Promise<BusinessHour[]> {
    const response = await api.get<any>(`/tenants/${tenantId}/business-hours`);
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Criar um novo horário de funcionamento
   */
  async create(tenantId: number | string, data: Omit<BusinessHour, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<BusinessHour> {
    const response = await api.post<any>(`/tenants/${tenantId}/business-hours`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Sincronizar múltiplos horários (cria ou atualiza conforme weekday)
   */
  async sync(tenantId: number | string, data: SyncBusinessHoursRequest): Promise<SyncBusinessHoursResponse> {
    const response = await api.post<any>(`/tenants/${tenantId}/business-hours/sync`, data);
    return response.data;
  }

  /**
   * Atualizar um horário de funcionamento
   */
  async update(
    tenantId: number | string,
    id: number | string,
    data: Partial<Omit<BusinessHour, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
  ): Promise<BusinessHour> {
    const response = await api.put<any>(`/tenants/${tenantId}/business-hours/${id}`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Deletar um horário de funcionamento
   */
  async delete(tenantId: number | string, id: number | string): Promise<void> {
    await api.delete(`/tenants/${tenantId}/business-hours/${id}`);
  }
}

export const businessHoursService = new BusinessHoursService();

