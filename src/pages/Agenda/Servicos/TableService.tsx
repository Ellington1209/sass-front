import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { serviceService, type Service as ServiceType } from '../../../shared/services/service.service';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface TableServiceProps {
  onEdit: (service: ServiceType) => void;
  onRefresh: () => void;
}

export const TableService: React.FC<TableServiceProps> = ({ onEdit, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const canEdit = hasPermission('service.edit');
  const canDelete = hasPermission('service.delete');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.list();
      // Adicionar key para cada serviço se não tiver
      const servicesWithKey = data.map((service) => ({
        ...service,
        key: service.id?.toString() || Math.random().toString(),
      }));
      setServices(servicesWithKey);
    } catch (error: any) {
      message.error('Erro ao carregar serviços: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await serviceService.delete(id);
      message.success('Serviço excluído com sucesso!');
      fetchServices();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir serviço: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um serviço para excluir');
      return;
    }

    try {
      await serviceService.deleteMany(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} serviço(s) excluído(s) com sucesso!`);
      setSelectedRowKeys([]);
      fetchServices();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir serviços: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatPrice = (price: ServiceType['price']) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: price.currency || 'BRL',
    }).format(price.price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const columns: AppTableColumn<ServiceType>[] = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Módulo',
      key: 'module',
      render: (_: any, record: ServiceType) => {
        return record.module ? <Tag color="blue">{record.module.name}</Tag> : '-';
      },
    },
    {
      title: 'Duração',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (minutes: number) => formatDuration(minutes),
      sorter: true,
    },
    {
      title: 'Preço',
      key: 'price',
      render: (_: any, record: ServiceType) => formatPrice(record.price),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: ServiceType) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (record.id && window.confirm('Tem certeza que deseja excluir este serviço?')) {
                  handleDelete(record.id);
                }
              }}
            >
              Excluir
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {selectedRowKeys.length > 0 && canDelete && (
        <div style={{ marginBottom: 16 }}>
          <Button danger onClick={handleDeleteMany}>
            Excluir Selecionados ({selectedRowKeys.length})
          </Button>
        </div>
      )}
      <AppTable
        columns={columns}
        dataSource={services}
        loading={loading}
        selectionType={canDelete ? "checkbox" : false}
        onSelectionChange={canDelete ? (keys) => setSelectedRowKeys(keys) : undefined}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} serviço(s)`,
        }}
      />
    </div>
  );
};

