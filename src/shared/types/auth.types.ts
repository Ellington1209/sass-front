export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number | null;
  role: string; // "tenant admin" | "tenant cliente" | "tenant profissional" | "super admin"
  is_super_admin?: boolean; // Mantido para compatibilidade
  is_tenant?: boolean; // Mantido para compatibilidade
}

export interface LoginResponse {
  user: User;
  permissions: string[];
  modules: string[];
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  modules: string[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
