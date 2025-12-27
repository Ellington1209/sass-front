import { api } from './api.service';

export interface Transaction {
  id?: number;
  tenant_id?: number;
  type: 'IN' | 'OUT';
  type_name?: string;
  amount: number;
  description?: string | null;
  category_id: number;
  payment_method_id: number;
  reference_type?: string | null;
  reference_id?: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  status_name?: string;
  occurred_at: string;
  created_by?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
    is_operational?: boolean;
  };
  payment_method?: {
    id: number;
    name: string;
  };
  commissions?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionRequest {
  type: 'IN' | 'OUT';
  amount: number;
  description?: string;
  category_id: number;
  payment_method_id: number;
  reference_type?: string | null;
  reference_id?: number | null;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  occurred_at?: string;
}

export interface TransactionListParams {
  type?: 'IN' | 'OUT';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  category_id?: number;
  payment_method_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

/**
 * Service para gerenciar transações financeiras
 */
class TransactionService {
  /**
   * Listar todas as transações
   */
  async list(params?: TransactionListParams): Promise<Transaction[]> {
    const response = await api.get<any>('/financial/transactions', { params });
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  /**
   * Buscar uma transação específica por ID
   */
  async getById(id: number | string): Promise<Transaction> {
    const response = await api.get<any>(`/financial/transactions/${id}`);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Criar nova transação financeira
   */
  async create(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await api.post<any>('/financial/transactions', data);
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }
}

export const transactionService = new TransactionService();

