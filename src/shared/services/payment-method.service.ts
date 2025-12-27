import { api } from './api.service';

export interface PaymentMethod {
  id: number;
  tenant_id?: number;
  name: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service para gerenciar métodos de pagamento
 */
class PaymentMethodService {
  /**
   * Listar todos os métodos de pagamento
   */
  async list(params?: {
    active?: boolean;
  }): Promise<PaymentMethod[]> {
    const response = await api.get<any>('/financial/payment-methods', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Buscar um método de pagamento específico por ID
   */
  async getById(id: number | string): Promise<PaymentMethod> {
    const response = await api.get<any>(`/financial/payment-methods/${id}`);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Criar novo método de pagamento
   */
  async create(data: {
    name: string;
    active?: boolean;
  }): Promise<PaymentMethod> {
    const response = await api.post<any>('/financial/payment-methods', data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }
}

export const paymentMethodService = new PaymentMethodService();

