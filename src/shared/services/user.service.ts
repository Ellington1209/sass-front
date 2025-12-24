import { CrudService } from './crud.service';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  tenant_id?: number | null;
  role?: string; // "tenant admin" | "tenant cliente" | "tenant profissional" | "super admin"
  is_super_admin?: boolean; // Mantido para compatibilidade
  is_tenant?: boolean; // Mantido para compatibilidade
  created_at?: string;
  updated_at?: string;
}

/**
 * Service para gerenciar usuários
 * Usa o CrudService genérico internamente
 */
class UserService extends CrudService<User> {
  constructor() {
    super('/users');
  }
}

export const userService = new UserService();

