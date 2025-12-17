import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TableService } from './TableService';
import { AddService } from './AddService';
import type { Service as ServiceType } from '../../../shared/services/service.service';
import { useAuth } from '../../../shared/contexts/AuthContext';

const { Title } = Typography;

export const Servicos = () => {
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canCreate = hasPermission('agenda.services.create');

  const handleAdd = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleEdit = (service: ServiceType) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Gerenciar Serviços</Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Cadastrar novo serviço
          </Button>
        )}
      </Space>

      <TableService
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {canCreate && (
        <AddService
          open={modalOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          service={editingService}
        />
      )}
    </div>
  );
};

