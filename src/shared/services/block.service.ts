import { api } from './api.service';

export interface Block {
  id?: number;
  provider_id?: number;
  tenant_id?: number;
  start_at: string; // formato datetime (YYYY-MM-DD HH:mm:ss ou ISO)
  end_at: string; // formato datetime (YYYY-MM-DD HH:mm:ss ou ISO)
  reason?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlockListParams {
  start?: string; // formato YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss
  end?: string; // formato YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss
}

/**
 * Service para gerenciar bloqueios do profissional
 */
class BlockService {
  /**
   * Listar bloqueios de um profissional
   */
  async list(providerId: number | string, params?: BlockListParams): Promise<Block[]> {
    const response = await api.get<any>(`/agenda/providers/${providerId}/blocks`, { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Criar um novo bloqueio
   */
  async create(providerId: number | string, data: Omit<Block, 'id' | 'provider_id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Block> {
    const response = await api.post<any>(`/agenda/providers/${providerId}/blocks`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Atualizar um bloqueio
   */
  async update(
    providerId: number | string,
    id: number | string,
    data: Partial<Omit<Block, 'id' | 'provider_id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>>
  ): Promise<Block> {
    const response = await api.put<any>(`/agenda/providers/${providerId}/blocks/${id}`, data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Deletar um bloqueio
   */
  async delete(providerId: number | string, id: number | string): Promise<void> {
    await api.delete(`/agenda/providers/${providerId}/blocks/${id}`);
  }
}

export const blockService = new BlockService();

