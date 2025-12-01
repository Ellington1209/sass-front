import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { tenantService, type Tenant as TenantType } from '../../../shared/services/tenant.service';
import type { Module } from '../../../shared/services/module.service';

interface TenantTableProps {
  onEdit: (tenant: TenantType) => void;
  onRefresh: () => void;
}

export const TenantTable: React.FC<TenantTableProps> = ({ onEdit, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.list();
      // Adicionar key para cada tenant se não tiver
      const tenantsWithKey = data.map((tenant) => ({
        ...tenant,
        key: tenant.id?.toString() || Math.random().toString(),
      }));
      setTenants(tenantsWithKey);
    } catch (error: any) {
      message.error('Erro ao carregar tenants: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await tenantService.delete(id);
      message.success('Tenant excluído com sucesso!');
      fetchTenants();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um tenant para excluir');
      return;
    }

    try {
      await tenantService.deleteMany(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} tenant(s) excluído(s) com sucesso!`);
      setSelectedRowKeys([]);
      fetchTenants();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir tenants: ' + (error.response?.data?.message || error.message));
    }
  };

  const columns: AppTableColumn<TenantType>[] = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Módulos Ativos',
      dataIndex: 'active_modules',
      key: 'active_modules',
      render: (modules: number[] | string[] | Module[]) => {
        if (!modules || modules.length === 0) {
          return <Tag color="default">Nenhum</Tag>;
        }

        // Se for array de objetos Module (verifica o primeiro elemento)
        const firstModule = modules[0];
        if (
          firstModule &&
          typeof firstModule === 'object' &&
          !Array.isArray(firstModule) &&
          'name' in firstModule &&
          'id' in firstModule
        ) {
          return (
            <Space wrap>
              {(modules as Module[]).map((module) => (
                <Tag key={module.id} color="blue">
                  {module.name}
                </Tag>
              ))}
            </Space>
          );
        }

        // Se for array de strings ou números
        return (
          <Space wrap>
            {modules.map((module, index) => (
              <Tag key={index} color="blue">
                {String(module)}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'status',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: TenantType) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              if (record.id && window.confirm('Tem certeza que deseja excluir este tenant?')) {
                handleDelete(record.id);
              }
            }}
          >
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Button danger onClick={handleDeleteMany}>
            Excluir Selecionados ({selectedRowKeys.length})
          </Button>
        </div>
      )}
      <AppTable
        columns={columns}
        dataSource={tenants}
        loading={loading}
        selectionType="checkbox"
        onSelectionChange={(keys) => setSelectedRowKeys(keys)}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} tenant(s)`,
        }}
      />
    </div>
  );
};

