import React, { useState, useMemo } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { MenuItem } from './types';

interface TenantMenuProps {
  onMenuClick?: () => void;
}

// Tipo para configuração de menu
interface MenuConfig {
  label: string;
  icon: ReactNode;
  rota?: string; // Rota do menu principal (se não for submenu)
  module?: string; // Módulo necessário para aparecer (se não tiver, sempre aparece)
  is_submenu: boolean;
  submenu?: Array<{
    label: string;
    rota: string;
    permission?: string; // Permissão necessária para aparecer
  }>;
}

// Configuração dos menus
const menuConfig: MenuConfig[] = [
  {
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    rota: '/dashboard',
    is_submenu: false,
  },
  {
    label: 'Cadastros',
    icon: <FileTextOutlined />,
    module: 'students',
    is_submenu: true,
    submenu: [
      {
        label: 'Alunos',
        rota: '/students',
        permission: 'students.view',
      },
    ],
  },
  {
    label: 'Agenda',
    icon: <CalendarOutlined />,
    rota: '/agenda',
    module: 'agenda',
    is_submenu: false,
  },
  {
    label: 'Configurações',
    icon: <SettingOutlined />,
    module: 'settings',
    is_submenu: true,
    submenu: [
      {
        label: 'Permissões e Usuarios',
        rota: '/settings/permissions-and-users',
        permission: 'settings.view',
      },
    ],
  },
];

/**
 * Menu para Tenants
 * Exibe menus baseados em módulos e permissões do usuário
 * Cada módulo só aparece se o usuário tiver acesso ao módulo
 * Cada item do menu só aparece se o usuário tiver a permissão necessária
 */
export const TenantMenu: React.FC<TenantMenuProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModule, hasPermission } = useAuth();
  const [stateOpenKeys, setStateOpenKeys] = useState<string[]>([]);

  // Processa a configuração e gera os menuItems
  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];

    menuConfig.forEach((config) => {
      // Verifica se tem o módulo necessário
      if (config.module && !hasModule(config.module)) {
        return; // Pula este menu se não tiver o módulo
      }

      // Se não for submenu, adiciona diretamente
      if (!config.is_submenu) {
        items.push({
          key: config.rota || '',
          icon: config.icon,
          label: config.label,
        });
        return;
      }

      // Se for submenu, processa os subitens
      if (config.is_submenu && config.submenu) {
        const submenuItems: MenuItem[] = [];

        config.submenu.forEach((subItem) => {
          // Verifica permissão se necessário
          if (subItem.permission && !hasPermission(subItem.permission)) {
            return; // Pula este item se não tiver permissão
          }

          submenuItems.push({
            key: subItem.rota,
            label: subItem.label,
          });
        });

        // Adiciona o menu principal apenas se houver subitens
        if (submenuItems.length > 0) {
          items.push({
            key: config.label.toLowerCase().replace(/\s+/g, '-'),
            icon: config.icon,
            label: config.label,
            children: submenuItems,
          });
        }
      }
    });

    return items;
  }, [hasModule, hasPermission]);

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
      items={menuItems}
    />
  );
};

