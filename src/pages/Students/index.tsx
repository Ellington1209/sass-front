import React, { useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { StudentTable, AddStudent } from './components';
import type { Student as StudentType } from '../../shared/services/student.service';

const { Title } = Typography;

export const Students: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleEdit = (student: StudentType) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Gerenciar Alunos</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Cadastrar novo aluno
        </Button>
      </Space>

      <StudentTable
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      <AddStudent
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        student={editingStudent}
      />
    </div>
  );
};