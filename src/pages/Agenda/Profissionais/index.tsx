import React, { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProviderTable, AddProvider } from './components';
import type { Provider as ProviderType } from '../../../shared/services/provider.service';

const { Title } = Typography;

export const Profissionais: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingProvider(null);
    setModalOpen(true);
  };

  const handleEdit = (provider: ProviderType) => {
    setEditingProvider(provider);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingProvider(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Gerenciar Profissionais</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Cadastrar novo profissional
        </Button>
      </Space>

      <ProviderTable
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      <AddProvider
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        provider={editingProvider}
      />
    </div>
  );
};