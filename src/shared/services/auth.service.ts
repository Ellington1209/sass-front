import { api, apiService } from './api.service';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Salvar token, dados do usuário, permissões e módulos
    if (response.data.token) {
      apiService.setToken(response.data.token);
      apiService.setUserData(JSON.stringify(response.data.user));
      apiService.setAuthData({
        permissions: response.data.permissions,
        modules: response.data.modules,
      });
    }
    
    return response.data;
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

