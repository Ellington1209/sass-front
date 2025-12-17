import { api } from './api.service';

export interface AdminService {
  id: number;
  name: string;
  slug: string;
}

/**
 * Service para buscar serviços administrativos
 */
class AdminServiceService {
  /**
   * Listar todos os serviços administrativos
   */
  async list(): Promise<AdminService[]> {
    const response = await api.get<AdminService[]>('/admin/services');
    return response.data;
  }
}

export const adminServiceService = new AdminServiceService();

