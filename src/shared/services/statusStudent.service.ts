import { api } from './api.service';

export interface StatusStudent {
  id: number;
  key: string;
  name: string;
  description?: string;
  order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service para gerenciar status de estudantes
 */
class StatusStudentService {
  /**
   * Listar todos os status disponíveis
   */
  async list(): Promise<StatusStudent[]> {
    const response = await api.get<StatusStudent[]>('/status-students');
    return response.data;
  }
}

export const statusStudentService = new StatusStudentService();

