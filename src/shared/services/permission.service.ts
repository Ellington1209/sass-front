import { api } from './api.service';

export interface Permission {
  id: number;
  key: string;
  label?: string;
}

export interface ModuleWithPermissions {
  id: number;
  name: string;
  key: string;
  permissions: Permission[];
}

export interface PermissionsResponse {
  modules: ModuleWithPermissions[];
  user_permissions: number[];
}

export interface SavePermissionsRequest {
  permission_ids: number[];
}

/**
 * Service para gerenciar permissões de usuários
 */
class PermissionService {
  /**
   * Buscar permissões disponíveis e permissões do usuário por tenant
   */
  async getTenantPermissions(tenantId: number, userId: number): Promise<PermissionsResponse> {
    const response = await api.get<PermissionsResponse>(`/tenants/${tenantId}/permissions/${userId}`);
    return response.data;
  }

  /**
   * Salvar permissões de um usuário
   */
  async saveUserPermissions(userId: number, permissionIds: number[]): Promise<void> {
    await api.post(`/users/${userId}/permissions`, {
      permission_ids: permissionIds,
    });
  }
}

export const permissionService = new PermissionService();

