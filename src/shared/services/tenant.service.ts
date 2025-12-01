import { CrudService } from './crud.service';
import type { Module } from './module.service';

export interface Tenant {
  id?: number;
  name: string;
  email?: string;
  document?: string;
  phone?: string;
  active: boolean;
  active_modules: number[] | string[] | Module[]; // Pode vir como IDs (number[]), slugs/names (string[]) ou objetos completos (Module[])
  admin_user_id?: number;
  users?: Array<{ id: number; name: string; email: string }>;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service específico para Tenant
 * Usa o CrudService genérico internamente
 */
class TenantService extends CrudService<Tenant> {
  constructor() {
    super('/admin/tenants');
  }

  // Métodos específicos de Tenant podem ser adicionados aqui
  // Por exemplo:
  // async activate(id: number): Promise<Tenant> {
  //   const response = await api.patch(`/admin/tenants/${id}/activate`);
  //   return response.data;
  // }
}

export const tenantService = new TenantService();

