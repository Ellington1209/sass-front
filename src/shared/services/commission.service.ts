import { api } from './api.service';

export interface CommissionConfig {
  id?: number;
  tenant_id?: number;
  provider_id: number;
  service_id?: number | null;
  origin_id?: number | null;
  commission_rate: number; // Taxa de comissão em % (0-100)
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relacionamentos (vindos da API)
  provider?: {
    id: number;
    name?: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  service?: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  origin?: {
    id: number;
    name: string;
    origin_type?: string;
  } | null;
}

export interface CreateCommissionConfigRequest {
  provider_id: number;
  service_id?: number | null;
  origin_id?: number | null;
  commission_rate: number; // 0-100
  active?: boolean;
}

export interface UpdateCommissionConfigRequest {
  commission_rate?: number;
  active?: boolean;
}

/**
 * Service para gerenciar configurações de comissões
 */
class CommissionService {
  /**
   * Listar todas as configurações de comissões
   */
  async listConfigs(params?: {
    provider_id?: number;
    service_id?: number;
    active?: boolean;
    search?: string;
  }): Promise<CommissionConfig[]> {
    const response = await api.get<any>('/financial/commission-configs', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Buscar configurações de comissão de um profissional específico
   */
  async getConfigsByProvider(providerId: number | string): Promise<CommissionConfig[]> {
    return this.listConfigs({ provider_id: Number(providerId) });
  }

  /**
   * Buscar uma configuração específica por ID
   */
  async getConfigById(id: number | string): Promise<CommissionConfig> {
    const response = await api.get<any>(`/financial/commission-configs/${id}`);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Criar nova configuração de comissão
   */
  async createConfig(data: CreateCommissionConfigRequest): Promise<CommissionConfig> {
    const response = await api.post<any>('/financial/commission-configs', data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Atualizar configuração de comissão
   */
  async updateConfig(
    id: number | string,
    data: UpdateCommissionConfigRequest
  ): Promise<CommissionConfig> {
    const response = await api.put<any>(`/financial/commission-configs/${id}`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Deletar configuração de comissão (soft delete)
   */
  async deleteConfig(id: number | string): Promise<void> {
    await api.delete(`/financial/commission-configs/${id}`);
  }
}

export const commissionService = new CommissionService();

