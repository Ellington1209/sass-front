import React, { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { InstanceCards } from './components/InstanceCards';
import { AddInstance } from './components/AddInstance';

const { Title } = Typography;

export const WhatsApp: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>WhatsApp</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Adicionar Instância
        </Button>
      </Space>

      <InstanceCards
        key={refreshKey}
        onRefresh={handleSuccess}
      />

      <AddInstance
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

