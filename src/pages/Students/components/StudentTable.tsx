import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message, Avatar, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { studentService, type Student as StudentType, type StudentListParams } from '../../../shared/services/student.service';
import { statusStudentService, type StatusStudent } from '../../../shared/services/statusStudent.service';

interface StudentTableProps {
  onEdit: (student: StudentType) => void;
  onRefresh: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ onEdit, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });
  const [filters, setFilters] = useState<StudentListParams>({
    page: 1,
    per_page: 15,
  });
  const [statusList, setStatusList] = useState<StatusStudent[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const fetchStudents = async (params?: StudentListParams) => {
    try {
      setLoading(true);
      const response = await studentService.listPaginated(params || filters);
      const studentsWithKey = response.data.map((student) => ({
        ...student,
        key: student.id?.toString() || Math.random().toString(),
      }));
      setStudents(studentsWithKey);
      setPagination({
        current: response.pagination.current_page,
        pageSize: response.pagination.per_page,
        total: response.pagination.total,
      });
    } catch (error: any) {
      message.error('Erro ao carregar alunos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const statuses = await statusStudentService.list();
        setStatusList(statuses.filter((s) => s.active));
      } catch (error) {
        console.error('Erro ao carregar status:', error);
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    fetchStudents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.per_page, filters.status, filters.category, filters.search]);

  const handleDelete = async (id: number) => {
    try {
      await studentService.delete(id);
      message.success('Aluno excluído com sucesso!');
      fetchStudents();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir aluno: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteMany = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Selecione pelo menos um aluno para excluir');
      return;
    }

    try {
      await studentService.deleteMany(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} aluno(s) excluído(s) com sucesso!`);
      setSelectedRowKeys([]);
      fetchStudents();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir alunos: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setFilters({
      ...filters,
      page,
      per_page: pageSize || filters.per_page,
    });
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({
      ...filters,
      page: 1,
      search: value || undefined,
    });
  };

  const handleStatusFilter = (value: number | string | undefined) => {
    setFilters({
      ...filters,
      page: 1,
      status: value || undefined,
    });
  };

  const handleCategoryFilter = (value: string | undefined) => {
    setFilters({
      ...filters,
      page: 1,
      category: value || undefined,
    });
  };

  const columns: AppTableColumn<StudentType>[] = [
    {
      title: 'Foto',
      dataIndex: 'photo_url',
      key: 'photo',
      width: 80,
      render: (photoUrl: string) => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const fullUrl = photoUrl?.startsWith('http') 
          ? photoUrl 
          : photoUrl 
            ? `${apiBaseUrl.replace('/api', '')}${photoUrl}`
            : null;
        return (
          <Avatar
            src={fullUrl || undefined}
            icon={<UserOutlined />}
            size="large"
          />
        );
      },
    },
    {
      title: 'Nome',
      key: 'name',
      render: (_: any, record: StudentType) => record.user?.name || '-',
    },
    {
      title: 'Email',
      key: 'email',
      render: (_: any, record: StudentType) => record.user?.email || '-',
    },
    {
      title: 'CPF',
      dataIndex: 'cpf',
      key: 'cpf',
      sorter: true,
    },
    {
      title: 'RG',
      dataIndex: 'rg',
      key: 'rg',
    },
    {
      title: 'Data de Nascimento',
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('pt-BR') : '-'),
    },
    {
      title: 'Telefone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        category ? <Tag color="blue">{category}</Tag> : '-'
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: StudentType) => (
        record.status ? <Tag color="green">{record.status.name}</Tag> : '-'
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: StudentType) => (
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
              if (record.id && window.confirm('Tem certeza que deseja excluir este aluno?')) {
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
          <Select
            placeholder="Filtrar por status"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusFilter}
            options={statusList.map((status) => ({
              value: status.id,
              label: status.name,
            }))}
          />
          <Select
            placeholder="Filtrar por categoria"
            allowClear
            style={{ width: 150 }}
            onChange={handleCategoryFilter}
            options={[
              { value: 'A', label: 'A' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
              { value: 'D', label: 'D' },
              { value: 'AB', label: 'AB' },
              { value: 'AC', label: 'AC' },
              { value: 'AD', label: 'AD' },
              { value: 'AE', label: 'AE' },
            ]}
          />
        </Space>

        {selectedRowKeys.length > 0 && (
          <Button danger onClick={handleDeleteMany}>
            Excluir Selecionados ({selectedRowKeys.length})
          </Button>
        )}
      </Space>

      <AppTable
        columns={columns}
        dataSource={students}
        loading={loading}
        selectionType="checkbox"
        onSelectionChange={(keys) => setSelectedRowKeys(keys)}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} aluno(s)`,
          onChange: handleTableChange,
          onShowSizeChange: handleTableChange,
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  );
};

