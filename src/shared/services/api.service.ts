import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token em todas as requisições
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros de autenticação
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Não redirecionar se for uma tentativa de login (deixa o erro ser tratado no componente)
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          
          if (!isLoginRequest) {
            // Token inválido ou expirado - apenas para requisições autenticadas
            this.clearToken();
            this.clearUserData();
            this.clearAuthData();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.api;
  }

  // Métodos para gerenciar token no localStorage
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Métodos para gerenciar dados do usuário
  setUserData(userData: string): void {
    localStorage.setItem('user_data', userData);
  }

  getUserData(): string | null {
    return localStorage.getItem('user_data');
  }

  clearUserData(): void {
    localStorage.removeItem('user_data');
  }

  // Métodos para gerenciar permissões e módulos
  setAuthData(authData: { permissions: string[]; modules: string[] }): void {
    localStorage.setItem('auth_permissions', JSON.stringify(authData.permissions));
    localStorage.setItem('auth_modules', JSON.stringify(authData.modules));
  }

  getPermissions(): string[] {
    const data = localStorage.getItem('auth_permissions');
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      
      // Se já for array, retornar
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Se for objeto, converter para array plano
      if (typeof parsed === 'object' && parsed !== null) {
        const flatPermissions: string[] = [];
        Object.values(parsed).forEach((modulePerms) => {
          if (Array.isArray(modulePerms)) {
            flatPermissions.push(...modulePerms);
          }
        });
        return flatPermissions;
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao parsear permissões:', error);
      return [];
    }
  }

  getModules(): string[] {
    const data = localStorage.getItem('auth_modules');
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      
      // Se já for array, retornar
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Se for objeto, retornar as chaves (nomes dos módulos)
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed);
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao parsear módulos:', error);
      return [];
    }
  }

  clearAuthData(): void {
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('auth_modules');
  }
}

export const apiService = new ApiService();
export const api = apiService.getInstance();

