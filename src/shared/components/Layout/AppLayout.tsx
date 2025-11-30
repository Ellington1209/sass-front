import React, { useState, useEffect } from 'react';
import { Layout, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppMenu } from '../Menu';
import './layout.scss';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal da aplicação
 * Inclui AppBar (Header) e menu lateral colapsável
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Em mobile, menu sempre começa fechado
      // Em desktop, menu sempre fica aberto
      if (mobile) {
        setCollapsed(true);
      } else {
        // Força menu aberto em desktop
        setCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Garantir que em desktop o menu nunca colapse
  useEffect(() => {
    if (!isMobile && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile, collapsed]);

  // Fechar menu em mobile ao clicar em um item
  const handleMenuClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menu dropdown do usuário
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Meu Perfil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className={`app-layout ${collapsed ? 'menu-collapsed' : ''}`} style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={isMobile ? collapsed : false}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        theme="light"
        className={`app-sider ${isMobile ? 'mobile' : 'desktop'} ${collapsed && isMobile ? 'collapsed' : ''}`}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          if (broken) {
            setCollapsed(true);
          } else {
            // Em desktop, sempre aberto
            setCollapsed(false);
          }
        }}
      >
        <div className="app-sider-content">
          <AppMenu onMenuClick={handleMenuClick} />
        </div>
      </Sider>

      <Layout>
        <Header className="app-header">
          <div className="app-header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                // Só permite colapsar em mobile
                if (isMobile) {
                  setCollapsed(!collapsed);
                }
              }}
              className="menu-trigger"
            />
            <Text strong className="app-title">
              Sistema SaaS
            </Text>
          </div>

          <div className="app-header-right">
            <Space>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space className="user-info" style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <Text>{user?.name}</Text>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content className="app-content">
          {children}
        </Content>
      </Layout>

      {/* Overlay para mobile quando menu está aberto */}
      {isMobile && !collapsed && (
        <div
          className="menu-overlay"
          onClick={() => setCollapsed(true)}
        />
      )}
    </Layout>
  );
};

