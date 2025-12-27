import { api } from './api.service';

export interface FinancialCategory {
  id: number;
  tenant_id?: number;
  name: string;
  is_operational?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFinancialCategoryRequest {
  name: string;
  is_operational?: boolean;
  active?: boolean;
}

/**
 * Service para gerenciar categorias financeiras
 */
class FinancialCategoryService {
  /**
   * Listar todas as categorias financeiras
   */
  async list(params?: {
    active?: boolean;
  }): Promise<FinancialCategory[]> {
    const response = await api.get<any>('/financial/categories', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Buscar uma categoria específica por ID
   */
  async getById(id: number | string): Promise<FinancialCategory> {
    const response = await api.get<any>(`/financial/categories/${id}`);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Criar nova categoria financeira
   */
  async create(data: CreateFinancialCategoryRequest): Promise<FinancialCategory> {
    const response = await api.post<any>('/financial/categories', data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }
}

export const financialCategoryService = new FinancialCategoryService();

