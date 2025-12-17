import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, message, Input, Select, Modal, Descriptions, Avatar, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { studentService, type Student as StudentType, type StudentListParams } from '../../../shared/services/student.service';
import { statusStudentService, type StatusStudent } from '../../../shared/services/statusStudent.service';
import { useAuth } from '../../../shared/contexts/AuthContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface StudentTableProps {
  onEdit: (student: StudentType) => void;
  onRefresh: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ onEdit, onRefresh }) => {
  const { hasPermission } = useAuth();
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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentType | null>(null);
  
  const canEdit = hasPermission('students.edit');
  const canDelete = hasPermission('students.delete');

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

  const handleView = (student: StudentType) => {
    setViewingStudent(student);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewingStudent(null);
  };

  const columns: AppTableColumn<StudentType>[] = [
    {
      title: 'Nome',
      key: 'name',
      render: (_: any, record: StudentType) => record.user?.name || '-',
      sorter: true,
    },
    {
      title: 'Email',
      key: 'email',
      render: (_: any, record: StudentType) => record.user?.email || '-',
    },
    {
      title: 'Telefone',
      key: 'phone',
      render: (_: any, record: StudentType) => record.person?.phone || record.phone || '-',
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_: any, record: StudentType) => {
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
                if (record.id && window.confirm('Tem certeza que deseja excluir este aluno?')) {
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

        {selectedRowKeys.length > 0 && canDelete && (
          <Button danger onClick={handleDeleteMany}>
            Excluir Selecionados ({selectedRowKeys.length})
          </Button>
        )}
      </Space>

      <AppTable
        columns={columns}
        dataSource={students}
        loading={loading}
        selectionType={canDelete ? "checkbox" : undefined}
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
      />

      <Modal
        title="Detalhes do Aluno"
        open={viewModalOpen}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Fechar
          </Button>,
        ]}
        width={700}
      >
        {viewingStudent && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {viewingStudent.photo_url ? (
                <Avatar
                  src={viewingStudent.photo_url}
                  icon={<UserOutlined />}
                  size={120}
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.open(viewingStudent.photo_url!, '_blank')}
                />
              ) : (
                <Avatar icon={<UserOutlined />} size={120} />
              )}
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Nome">
                <Text strong>{viewingStudent.user?.name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewingStudent.user?.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="CPF">
                {viewingStudent.person?.cpf || viewingStudent.cpf || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="RG">
                {viewingStudent.person?.rg || viewingStudent.rg || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Data de Nascimento">
                {viewingStudent.person?.birth_date || viewingStudent.birth_date
                  ? dayjs(viewingStudent.person?.birth_date || viewingStudent.birth_date).format('DD/MM/YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Telefone">
                {viewingStudent.person?.phone || viewingStudent.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Endereço">
                {(() => {
                  const address = viewingStudent.person?.address || viewingStudent.address;
                  if (address) {
                    const parts = [
                      address.street || viewingStudent.address_street,
                      address.number || viewingStudent.address_number,
                      address.neighborhood || viewingStudent.address_neighborhood,
                      address.city || viewingStudent.address_city,
                      address.state || viewingStudent.address_state,
                      address.zip || viewingStudent.address_zip,
                    ].filter(Boolean);
                    return parts.length > 0 ? parts.join(', ') : '-';
                  }
                  return '-';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Categoria">
                {viewingStudent.category ? (
                  <Tag color="blue">{viewingStudent.category}</Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {viewingStudent.status ? (
                  <Tag color="green">{viewingStudent.status.name}</Tag>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

