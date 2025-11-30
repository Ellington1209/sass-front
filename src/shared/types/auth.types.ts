export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number | null;
  is_super_admin: boolean;
  is_tenant: boolean;
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
