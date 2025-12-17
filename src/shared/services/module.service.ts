import { api } from './api.service';

export interface Module {
  id: number;
  name: string;
  slug?: string;
  key?: string; // Alias para slug, usado pelo backend
  description?: string;
  is_active?: boolean;
}

/**
 * Service para gerenciar módulos
 */
class ModuleService {
  /**
   * Listar todos os módulos disponíveis
   */
  async list(): Promise<Module[]> {
    const response = await api.get<Module[]>('/admin/modules');
    return response.data;
  }
  async listServices(): Promise<Module[]> {
    const response = await api.get<Module[]>('/admin/modules/services');
    return response.data;
  }
}

export const moduleService = new ModuleService();

