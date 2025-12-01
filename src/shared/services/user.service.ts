import { api } from './api.service';

export interface User {
  id: number;
  name: string;
  email: string;
  is_super_admin?: boolean;
  is_tenant?: boolean;
}

/**
 * Service para gerenciar usuários
 */
class UserService {
  /**
   * Listar todos os usuários (para seleção de admin)
   */
  async list(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  }

  /**
   * Buscar usuário por ID
   */
  async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }
}

export const userService = new UserService();

