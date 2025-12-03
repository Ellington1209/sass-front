import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../../shared/components/Table';
import { userService, type User as UserType } from '../../../../shared/services/user.service';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface TableUsuarioProps {
  onEdit: (user: UserType) => void;
  onRefresh: () => void;
}

export const TableUsuario: React.FC<TableUsuarioProps> = ({ onEdit, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const canEdit = hasPermission('admin.users.edit');
  const canDelete = hasPermission('admin.users.delete');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.list();
      // Adicionar key para cada usuário se não tiver
      const usersWithKey = data.map((user) => ({
        ...user,
        key: user.id?.toString() || Math.random().toString(),
      }));
      setUsers(usersWithKey);
    } catch (error: any) {
      message.error('Erro ao carregar usuários: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await userService.delete(id);
      message.success('Usuário excluído com sucesso!');
      fetchUsers();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir usuário: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um usuário para excluir');
      return;
    }

    try {
      await userService.deleteMany(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} usuário(s) excluído(s) com sucesso!`);
      setSelectedRowKeys([]);
      fetchUsers();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir usuários: ' + (error.response?.data?.message || error.message));
    }
  };

  const columns: AppTableColumn<UserType>[] = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: 'Tipo',
      key: 'type',
      render: (_: any, record: UserType) => {
        if (record.is_super_admin) {
          return <Tag color="gold">Super Admin</Tag>;
        }
        if (record.is_tenant) {
          return <Tag color="blue">Tenant</Tag>;
        }
        return <Tag color="default">Usuário</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: UserType) => (
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
                if (record.id && window.confirm('Tem certeza que deseja excluir este usuário?')) {
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
        dataSource={users}
        loading={loading}
        selectionType={canDelete ? "checkbox" : false}
        onSelectionChange={canDelete ? (keys) => setSelectedRowKeys(keys) : undefined}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} usuário(s)`,
        }}
      />
    </div>
  );
};
