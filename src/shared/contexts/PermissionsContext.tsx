import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canView: (permission: string) => boolean;
  canCreate: (permission: string) => boolean;
  canEdit: (permission: string) => boolean;
  canDelete: (permission: string) => boolean;
  canManage: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

/**
 * Provider de permissões
 * Facilita o uso de permissões em componentes
 */
export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const { hasPermission: authHasPermission, isSuperAdmin } = useAuth();

  // Se for super admin, tem todas as permissões
  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin()) {
      return true;
    }
    return authHasPermission(permission);
  };

  // Verifica se tem pelo menos uma das permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(hasPermission);
  };

  // Verifica se tem todas as permissões
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(hasPermission);
  };

  // Helpers para ações comuns
  const canView = (module: string): boolean => {
    return hasPermission(`${module}.view`) || hasPermission(`${module}.manage`);
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.create`) || hasPermission(`${module}.manage`);
  };

  const canEdit = (module: string): boolean => {
    return hasPermission(`${module}.edit`) || hasPermission(`${module}.manage`);
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(`${module}.delete`) || hasPermission(`${module}.manage`);
  };

  const canManage = (module: string): boolean => {
    return hasPermission(`${module}.manage`);
  };

  const value: PermissionsContextType = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

