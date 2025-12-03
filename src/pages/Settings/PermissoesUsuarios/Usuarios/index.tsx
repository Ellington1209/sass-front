import { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TableUsuario } from './TableUsuario';
import { AddUsuario } from './AddUsuario';
import type { User as UserType } from '../../../../shared/services/user.service';

const { Title } = Typography;

export const Usuarios = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Gerenciar Usuários</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Cadastrar novo usuário
        </Button>
      </Space>

      <TableUsuario
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      <AddUsuario
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        user={editingUser}
      />
    </div>
  );
};