import { CrudService } from './crud.service';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  tenant_id?: number | null;
  is_super_admin?: boolean;
  is_tenant?: boolean;
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

