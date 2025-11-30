import React, { useState } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import type { MenuItem } from './types';

interface TenantMenuProps {
  onMenuClick?: () => void;
}

/**
 * Menu para Tenants
 * Exibe menus baseados em módulos e permissões do usuário
 */
export const TenantMenu: React.FC<TenantMenuProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModule, hasPermission } = useAuth();
  const [stateOpenKeys, setStateOpenKeys] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    // Menu sempre visível
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
  ];

  // Menu baseado em módulo - Estoque
  if (hasModule('Estoque')) {
    const estoqueChildren: MenuItem[] = [
      {
        key: '/estoque',
        label: 'Listar Produtos',
      },
    ];

    if (hasPermission('estoque.create')) {
      estoqueChildren.push({
        key: '/estoque/novo',
        label: 'Novo Produto',
      });
    }

    if (hasPermission('estoque.edit')) {
      estoqueChildren.push({
        key: '/estoque/editar',
        label: 'Editar Produto',
      });
    }

    if (hasPermission('estoque.delete')) {
      estoqueChildren.push({
        key: '/estoque/excluir',
        label: 'Excluir Produto',
      });
    }

    menuItems.push({
      key: 'estoque',
      icon: <ShoppingOutlined />,
      label: 'Estoque',
      children: estoqueChildren,
    });
  }

  // Menu baseado em módulo - Cliente
  if (hasModule('Cliente')) {
    const clienteChildren: MenuItem[] = [
      {
        key: '/cliente',
        label: 'Listar Clientes',
      },
    ];

    if (hasPermission('cliente.create')) {
      clienteChildren.push({
        key: '/cliente/novo',
        label: 'Novo Cliente',
      });
    }

    if (hasPermission('cliente.edit')) {
      clienteChildren.push({
        key: '/cliente/editar',
        label: 'Editar Cliente',
      });
    }

    menuItems.push({
      key: 'cliente',
      icon: <UserOutlined />,
      label: 'Clientes',
      children: clienteChildren,
    });
  }

  // Menu baseado em módulo - Financeiro
  if (hasModule('Financeiro')) {
    const financeiroChildren: MenuItem[] = [];

    if (hasPermission('financeiro.view')) {
      financeiroChildren.push({
        key: '/financeiro',
        label: 'Dashboard Financeiro',
      });
    }

    if (hasPermission('financeiro.transacoes')) {
      financeiroChildren.push({
        key: '/financeiro/transacoes',
        label: 'Transações',
      });
    }

    if (hasPermission('financeiro.relatorios')) {
      financeiroChildren.push({
        key: '/financeiro/relatorios',
        label: 'Relatórios',
      });
    }

    if (financeiroChildren.length > 0) {
      menuItems.push({
        key: 'financeiro',
        icon: <DollarOutlined />,
        label: 'Financeiro',
        children: financeiroChildren,
      });
    }
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
      items={menuItems}
    />
  );
};

