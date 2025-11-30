import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SuperAdminMenu } from './SuperAdminMenu';
import { TenantMenu } from './TenantMenu';
import './menu.scss';

interface AppMenuProps {
  onMenuClick?: () => void;
}

/**
 * Componente principal de menu
 * Decide qual menu exibir baseado no tipo de usuário:
 * - Super Admin: mostra menu de administração
 * - Tenant: mostra menu de tenant (com módulos e permissões)
 * - Funcionário: mostra menu de tenant (com permissões específicas)
 */
export const AppMenu: React.FC<AppMenuProps> = ({ onMenuClick }) => {
  const { isSuperAdmin } = useAuth();

  // Se for super admin, mostra o menu de super admin
  // Super admin tem todas as permissões, mas o menu ainda verifica permissões
  // para funcionários que também são super admin
  if (isSuperAdmin()) {
    return <SuperAdminMenu onMenuClick={onMenuClick} />;
  }

  // Caso contrário, mostra o menu de tenant (funciona para tenant e funcionário)
  // O menu já verifica módulos e permissões internamente
  return <TenantMenu onMenuClick={onMenuClick} />;
};

