/**
 * EXEMPLOS DE USO DO COMPONENTE AppTable
 * 
 * Este arquivo mostra como usar o AppTable em diferentes cenários
 */

import React, { useState } from 'react';
import { Button, Tag, Space } from 'antd';
import { AppTable, type AppTableColumn } from './AppTable';

// ============================================
// EXEMPLO 1: Tabela básica
// ============================================
interface User {
  key: string;
  id: number;
  name: string;
  email: string;
  age: number;
  status: 'ativo' | 'inativo';
}

export const Exemplo1: React.FC = () => {
  const columns: AppTableColumn<User>[] = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Idade',
      dataIndex: 'age',
      key: 'age',
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ativo' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const data: User[] = [
    { key: '1', id: 1, name: 'João Silva', email: 'joao@email.com', age: 32, status: 'ativo' },
    { key: '2', id: 2, name: 'Maria Santos', email: 'maria@email.com', age: 28, status: 'ativo' },
    { key: '3', id: 3, name: 'Pedro Costa', email: 'pedro@email.com', age: 45, status: 'inativo' },
  ];

  return <AppTable columns={columns} dataSource={data} />;
};

// ============================================
// EXEMPLO 2: Tabela com seleção (checkbox)
// ============================================
export const Exemplo2: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<User[]>([]);

  const columns: AppTableColumn<User>[] = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Idade', dataIndex: 'age', key: 'age', sorter: true },
  ];

  const data: User[] = [
    { key: '1', id: 1, name: 'João Silva', email: 'joao@email.com', age: 32, status: 'ativo' },
    { key: '2', id: 2, name: 'Maria Santos', email: 'maria@email.com', age: 28, status: 'ativo' },
  ];

  const handleSelectionChange = (selectedRowKeys: React.Key[], selectedRows: User[]) => {
    console.log('Linhas selecionadas:', selectedRowKeys, selectedRows);
    setSelectedRows(selectedRows);
  };

  return (
    <div>
      <AppTable
        columns={columns}
        dataSource={data}
        selectionType="checkbox"
        onSelectionChange={handleSelectionChange}
      />
      {selectedRows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p>Linhas selecionadas: {selectedRows.length}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// EXEMPLO 3: Tabela com ações
// ============================================
export const Exemplo3: React.FC = () => {
  const handleEdit = (record: User) => {
    console.log('Editar:', record);
  };

  const handleDelete = (record: User) => {
    console.log('Excluir:', record);
  };

  const columns: AppTableColumn<User>[] = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  const data: User[] = [
    { key: '1', id: 1, name: 'João Silva', email: 'joao@email.com', age: 32, status: 'ativo' },
    { key: '2', id: 2, name: 'Maria Santos', email: 'maria@email.com', age: 28, status: 'ativo' },
  ];

  return <AppTable columns={columns} dataSource={data} />;
};

// ============================================
// EXEMPLO 4: Tabela com loading e paginação customizada
// ============================================
export const Exemplo4: React.FC = () => {
  const [loading] = useState(false);

  const columns: AppTableColumn<User>[] = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Idade', dataIndex: 'age', key: 'age' },
  ];

  const data: User[] = [
    { key: '1', id: 1, name: 'João Silva', email: 'joao@email.com', age: 32, status: 'ativo' },
    { key: '2', id: 2, name: 'Maria Santos', email: 'maria@email.com', age: 28, status: 'ativo' },
  ];

  return (
    <AppTable
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        pageSize: 5,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `Total: ${total} itens`,
      }}
    />
  );
};

// ============================================
// EXEMPLO 5: Tabela com filtros
// ============================================
export const Exemplo5: React.FC = () => {
  const columns: AppTableColumn<User>[] = [
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Ativo', value: 'ativo' },
        { text: 'Inativo', value: 'inativo' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={status === 'ativo' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const data: User[] = [
    { key: '1', id: 1, name: 'João Silva', email: 'joao@email.com', age: 32, status: 'ativo' },
    { key: '2', id: 2, name: 'Maria Santos', email: 'maria@email.com', age: 28, status: 'ativo' },
    { key: '3', id: 3, name: 'Pedro Costa', email: 'pedro@email.com', age: 45, status: 'inativo' },
  ];

  return <AppTable columns={columns} dataSource={data} />;
};

