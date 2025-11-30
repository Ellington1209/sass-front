import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShopOutlined,
  SettingOutlined,
  UserOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { MenuItem } from './types';

interface SuperAdminMenuProps {
  onMenuClick?: () => void;
}

/**
 * Menu para Super Admin
 * Exibe menus baseados em permissões (funcionários também têm permissões)
 */
export const SuperAdminMenu: React.FC<SuperAdminMenuProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const [stateOpenKeys, setStateOpenKeys] = useState<string[]>([]);

  const items: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
  ];

  // Menu de Administração - verifica permissões
  const adminChildren: MenuItem[] = [];

  // Gerenciar Tenants - verifica permissão
  if (hasPermission('admin.tenants.view') || hasPermission('admin.tenants.manage')) {
    adminChildren.push({
      key: '/admin/tenants',
      icon: <ShopOutlined />,
      label: 'Gerenciar Tenants',
    });
  }

  // Gerenciar Usuários - verifica permissão
  if (hasPermission('admin.users.view') || hasPermission('admin.users.manage')) {
    adminChildren.push({
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Gerenciar Usuários',
    });
  }

  // Gerenciar Módulos - verifica permissão
  if (hasPermission('admin.modules.view') || hasPermission('admin.modules.manage')) {
    adminChildren.push({
      key: '/admin/modules',
      icon: <AppstoreOutlined />,
      label: 'Gerenciar Módulos',
    });
  }

  // Gerenciar Permissões - verifica permissão
  if (hasPermission('admin.permissions.view') || hasPermission('admin.permissions.manage')) {
    adminChildren.push({
      key: '/admin/permissions',
      icon: <SettingOutlined />,
      label: 'Gerenciar Permissões',
    });
  }

  // Só adiciona o menu de Administração se houver pelo menos um item
  if (adminChildren.length > 0) {
    items.push({
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Administração',
      children: adminChildren,
    });
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    onMenuClick?.();
  };

  const onOpenChange: MenuProps['onOpenChange'] = (openKeys) => {
    const currentOpenKey = openKeys.find((key) => !stateOpenKeys.includes(key));

    if (currentOpenKey !== undefined) {
      // Abrir submenu - manter apenas o submenu atual aberto
      setStateOpenKeys([currentOpenKey]);
    } else {
      // Fechar submenu
      setStateOpenKeys(openKeys);
    }
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      openKeys={stateOpenKeys}
      onOpenChange={onOpenChange}
      onClick={handleMenuClick}
      className="app-menu"
      items={items}
    />
  );
};

