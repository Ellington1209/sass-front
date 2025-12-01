import React, { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TenantTable, AddTenant } from './components';
import type { Tenant as TenantType } from '../../shared/services/tenant.service';

const { Title } = Typography;

export const Tenant: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingTenant(null);
    setModalOpen(true);
  };

  const handleEdit = (tenant: TenantType) => {
    setEditingTenant(tenant);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingTenant(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Gerenciar Tenants</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Cadastrar nova empresa
        </Button>
      </Space>

      <TenantTable
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      <AddTenant
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        tenant={editingTenant}
      />
    </div>
  );
};