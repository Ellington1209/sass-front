import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message, Avatar, Input } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../../shared/components/Table';
import { providerService, type Provider as ProviderType } from '../../../../shared/services/provider.service';
import { useAuth } from '../../../../shared/contexts/AuthContext';

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
    const filtered = providers.filter((provider) => {
      const searchLower = value.toLowerCase();
      const name = provider.user?.name?.toLowerCase() || '';
      const email = provider.user?.email?.toLowerCase() || '';
      const cpf = provider.person?.cpf?.toLowerCase() || provider.cpf?.toLowerCase() || '';
      return name.includes(searchLower) || email.includes(searchLower) || cpf.includes(searchLower);
    });
    // Note: Esta é uma busca local. Se precisar de busca no backend, ajustar fetchProviders
  };

  const columns: AppTableColumn<ProviderType>[] = [
    {
      title: 'Foto',
      dataIndex: 'photo_url',
      key: 'photo',
      width: 80,
      render: (photoUrl: string) => {
        let fullUrl: string | undefined = undefined;
        
        if (photoUrl) {
          if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            fullUrl = photoUrl;
          } else {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
            fullUrl = `${apiBaseUrl.replace('/api', '')}${photoUrl}`;
          }
        }
        
        return (
          <Avatar
            src={fullUrl}
            icon={<UserOutlined />}
            size="large"
            style={{ cursor: fullUrl ? 'pointer' : 'default' }}
            onClick={() => {
              if (fullUrl) {
                window.open(fullUrl, '_blank');
              }
            }}
          />
        );
      },
    },
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
      title: 'CPF',
      key: 'cpf',
      render: (_: any, record: ProviderType) => record.person?.cpf || record.cpf || '-',
      sorter: true,
    },
    {
      title: 'Telefone',
      key: 'phone',
      render: (_: any, record: ProviderType) => record.person?.phone || record.phone || '-',
    },
    {
      title: 'Serviços',
      key: 'services',
      render: (_: any, record: ProviderType) => {
        if (record.service_ids && record.service_ids.length > 0) {
          return (
            <Space wrap>
              {record.service_ids.map((id) => (
                <Tag key={id} color="blue">{id}</Tag>
              ))}
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: canEdit || canDelete ? 150 : 0,
      render: (_: any, record: ProviderType) => {
        const actions = [];
        
        if (canEdit) {
          actions.push(
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Editar
            </Button>
          );
        }
        
        if (canDelete) {
          actions.push(
            <Button
              key="delete"
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (record.id && window.confirm('Tem certeza que deseja excluir este profissional?')) {
                  handleDelete(record.id);
                }
              }}
            >
              Excluir
            </Button>
          );
        }
        
        return actions.length > 0 ? <Space>{actions}</Space> : '-';
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
        scroll={{ x: 1000 }}
      />
    </div>
  );
};

