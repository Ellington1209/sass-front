import React from 'react';
import { Typography, Card, Space } from 'antd';
import { useAuth } from '../../shared/contexts/AuthContext';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user, modules, permissions, isSuperAdmin } = useAuth();

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Dashboard</Title>
          
          <Card>
            <Space orientation="vertical">
              <Text strong>Bem-vindo, {user?.name}!</Text>
              <Text type="secondary">Email: {user?.email}</Text>
              {isSuperAdmin() && (
                <Text type="warning">Super Admin</Text>
              )}
              {user?.tenant_id && (
                <Text>Tenant ID: {user.tenant_id}</Text>
              )}
            </Space>
          </Card>

          <Card title="Módulos Ativos">
            <Space wrap>
              {modules.length > 0 ? (
                modules.map((module) => (
                  <Text key={module} code>{module}</Text>
                ))
              ) : (
                <Text type="secondary">Nenhum módulo ativo</Text>
              )}
            </Space>
          </Card>

          <Card title="Permissões">
            <Space wrap>
              {permissions.length > 0 ? (
                permissions.map((permission) => (
                  <Text key={permission} code>{permission}</Text>
                ))
              ) : (
                <Text type="secondary">Nenhuma permissão atribuída</Text>
              )}
            </Space>
          </Card>
    </Space>
  );
};

