import { api, apiService } from './api.service';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

class AuthService {
  /**
   * Converte permissões de objeto agrupado por módulos para array plano
   */
  private flattenPermissions(permissions: any): string[] {
    if (Array.isArray(permissions)) {
      return permissions;
    }
    
    if (typeof permissions === 'object' && permissions !== null) {
      // Se for objeto, extrair todas as permissões de todos os módulos
      const flatPermissions: string[] = [];
      Object.values(permissions).forEach((modulePerms) => {
        if (Array.isArray(modulePerms)) {
          flatPermissions.push(...modulePerms);
        }
      });
      return flatPermissions;
    }
    
    return [];
  }

  /**
   * Converte módulos de objeto para array de nomes
   */
  private flattenModules(modules: any): string[] {
    if (Array.isArray(modules)) {
      return modules;
    }
    
    if (typeof modules === 'object' && modules !== null) {
      // Se for objeto, retornar as chaves (nomes dos módulos)
      return Object.keys(modules);
    }
    
    return [];
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<any>('/auth/login', credentials);
    
    // Converter permissões e módulos para arrays planos
    const flatPermissions = this.flattenPermissions(response.data.permissions);
    const flatModules = this.flattenModules(response.data.modules);
    
    // Salvar token, dados do usuário, permissões e módulos
    if (response.data.token) {
      apiService.setToken(response.data.token);
      apiService.setUserData(JSON.stringify(response.data.user));
      apiService.setAuthData({
        permissions: flatPermissions,
        modules: flatModules,
      });
    }
    
    return {
      ...response.data,
      permissions: flatPermissions,
      modules: flatModules,
    };
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar todos os dados locais mesmo se a requisição falhar
      apiService.clearToken();
      apiService.clearUserData();
      apiService.clearAuthData(); // Limpa permissões e módulos
    }
  }

  getStoredToken(): string | null {
    return apiService.getToken();
  }

  getStoredUserData(): string | null {
    return apiService.getUserData();
  }

  clearAuthData(): void {
    apiService.clearToken();
    apiService.clearUserData();
    apiService.clearAuthData();
  }
}

export const authService = new AuthService();

