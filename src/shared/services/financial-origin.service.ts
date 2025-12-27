import { api } from './api.service';

export interface FinancialOrigin {
  id: number;
  tenant_id?: number;
  name: string;
  origin_type?: 'OPERATIONAL' | 'MANUAL';
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service para gerenciar origens financeiras
 */
class FinancialOriginService {
  /**
   * Listar todas as origens financeiras
   */
  async list(params?: {
    active?: boolean;
    origin_type?: 'OPERATIONAL' | 'MANUAL';
  }): Promise<FinancialOrigin[]> {
    const response = await api.get<any>('/financial/origins', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Buscar uma origem específica por ID
   */
  async getById(id: number | string): Promise<FinancialOrigin> {
    const response = await api.get<any>(`/financial/origins/${id}`);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }
}

export const financialOriginService = new FinancialOriginService();

