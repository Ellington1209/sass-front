import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message, Input, Modal, Descriptions, Avatar, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../../shared/components/Table';
import { providerService, type Provider as ProviderType } from '../../../../shared/services/provider.service';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ProviderTableProps {
  onEdit: (provider: ProviderType) => void;
  onRefresh: () => void;
}

export const ProviderTable: React.FC<ProviderTableProps> = ({ onEdit, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingProvider, setViewingProvider] = useState<ProviderType | null>(null);
  
  const canEdit = hasPermission('agenda.providers.edit');
  const canDelete = hasPermission('agenda.providers.delete');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await providerService.list();
      const providersWithKey = data.map((provider) => ({
        ...provider,
        key: provider.id?.toString() || Math.random().toString(),
      }));
      setProviders(providersWithKey);
    } catch (error: any) {
      message.error('Erro ao carregar profissionais: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await providerService.delete(id);
      message.success('Profissional excluído com sucesso!');
      fetchProviders();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir profissional: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um profissional para excluir');
      return;
    }

    try {
      await providerService.deleteMany(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} profissional(is) excluído(s) com sucesso!`);
      setSelectedRowKeys([]);
      fetchProviders();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir profissionais: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    // Note: Esta é uma busca local. Se precisar de busca no backend, ajustar fetchProviders
  };

  const handleView = (provider: ProviderType) => {
    setViewingProvider(provider);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingProvider(null);
  };

  const columns: AppTableColumn<ProviderType>[] = [
    {
      title: 'Nome',
      key: 'name',
      render: (_: any, record: ProviderType) => record.user?.name || '-',
      sorter: true,
    },
    {
      title: 'Email',
      key: 'email',
      render: (_: any, record: ProviderType) => record.user?.email || '-',
    },
    {
      title: 'Telefone',
      key: 'phone',
      render: (_: any, record: ProviderType) => record.person?.phone || record.phone || '-',
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_: any, record: ProviderType) => {
        const actions = [];
        
        actions.push(
          <Button
            key="view"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Visualizar"
          />
        );
        
        if (canEdit) {
          actions.push(
            <Button
              key="edit"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              title="Editar"
            />
          );
        }
        
        if (canDelete) {
          actions.push(
            <Button
              key="delete"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (record.id && window.confirm('Tem certeza que deseja excluir este profissional?')) {
                  handleDelete(record.id);
                }
              }}
              title="Excluir"
            />
          );
        }
        
        return <Space>{actions}</Space>;
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Buscar por nome, email ou CPF"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        </Space>

        {selectedRowKeys.length > 0 && canDelete && (
          <Button danger onClick={handleDeleteMany}>
            Excluir Selecionados ({selectedRowKeys.length})
          </Button>
        )}
      </Space>

      <AppTable
        columns={columns}
        dataSource={providers}
        loading={loading}
        selectionType={canDelete ? "checkbox" : undefined}
        onSelectionChange={(keys) => setSelectedRowKeys(keys)}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} profissional(is)`,
        }}
      />

      <Modal
        title="Detalhes do Profissional"
        open={viewModalOpen}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Fechar
          </Button>,
        ]}
        width={700}
      >
        {viewingProvider && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {viewingProvider.photo_url ? (
                <Avatar
                  src={viewingProvider.photo_url}
                  icon={<UserOutlined />}
                  size={120}
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(viewingProvider.photo_url!, '_blank')}
                />
              ) : (
                <Avatar icon={<UserOutlined />} size={120} />
              )}
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Nome">
                <Text strong>{viewingProvider.user?.name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewingProvider.user?.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="CPF">
                {viewingProvider.person?.cpf || viewingProvider.cpf || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="RG">
                {viewingProvider.person?.rg || viewingProvider.rg || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Data de Nascimento">
                {viewingProvider.person?.birth_date || viewingProvider.birth_date
                  ? dayjs(viewingProvider.person?.birth_date || viewingProvider.birth_date).format('DD/MM/YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Telefone">
                {viewingProvider.person?.phone || viewingProvider.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Endereço">
                {(() => {
                  const address = viewingProvider.person?.address || viewingProvider.address;
                  if (address) {
                    const parts = [
                      address.street || viewingProvider.address_street,
                      address.number || viewingProvider.address_number,
                      address.neighborhood || viewingProvider.address_neighborhood,
                      address.city || viewingProvider.address_city,
                      address.state || viewingProvider.address_state,
                      address.zip || viewingProvider.address_zip,
                    ].filter(Boolean);
                    return parts.length > 0 ? parts.join(', ') : '-';
                  }
                  return '-';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Serviços">
                {viewingProvider.services && viewingProvider.services.length > 0 ? (
                  <Space wrap>
                    {viewingProvider.services.map((service) => (
                      <Tag key={service.id} color="blue">{service.name}</Tag>
                    ))}
                  </Space>
                ) : viewingProvider.service_ids && viewingProvider.service_ids.length > 0 ? (
                  <Space wrap>
                    {viewingProvider.service_ids.map((id) => (
                      <Tag key={id} color="blue">{id}</Tag>
                    ))}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

