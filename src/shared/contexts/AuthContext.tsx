import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginResponse, AuthState } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { apiService } from '../services/api.service';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasModule: (module: string) => boolean;
  isSuperAdmin: () => boolean;
  isTenant: () => boolean;
  isEmployee: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: [],
    modules: [],
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Verificar se há dados salvos ao carregar
  useEffect(() => {
    const initializeAuth = () => {
      const token = authService.getStoredToken();
      const userData = authService.getStoredUserData();
      const permissions = apiService.getPermissions();
      const modules = apiService.getModules();

      if (token && userData) {
        try {
          const user: User = JSON.parse(userData);
          // Garantir que permissions e modules sejam arrays
          const safePermissions = Array.isArray(permissions) ? permissions : [];
          const safeModules = Array.isArray(modules) ? modules : [];
          
          setAuthState({
            user,
            permissions: safePermissions,
            modules: safeModules,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Erro ao parsear dados do usuário:', error);
          authService.clearAuthData();
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response: LoginResponse = await authService.login({ email, password });
      
      setAuthState({
        user: response.user,
        permissions: response.permissions,
        modules: response.modules,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      user: null,
      permissions: [],
      modules: [],
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const hasPermission = (permission: string): boolean => {
    // Garantir que permissions seja sempre um array
    if (!Array.isArray(authState.permissions)) {
      return false;
    }
    return authState.permissions.includes(permission);
  };

  const hasModule = (module: string): boolean => {
    // Garantir que modules seja sempre um array
    if (!Array.isArray(authState.modules)) {
      return false;
    }
    return authState.modules.includes(module);
  };

  const isSuperAdmin = (): boolean => {
    const role = authState.user?.role?.toLowerCase();
    // Verifica se é super admin pelo role ou pelo campo legado
    return role === 'super admin' || authState.user?.is_super_admin === true;
  };

  const isTenant = (): boolean => {
    const role = authState.user?.role?.toLowerCase();
    // Verifica se é tenant admin pelo role ou pelo campo legado
    return role === 'tenant admin' || authState.user?.is_tenant === true;
  };

  const isEmployee = (): boolean => {
    const role = authState.user?.role?.toLowerCase();
    // É employee se não for super admin nem tenant admin
    return !isSuperAdmin() && !isTenant() && role !== 'tenant cliente' && role !== 'tenant profissional';
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    hasModule,
    isSuperAdmin,
    isTenant,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

