import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Upload, message, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { studentService, type Student as StudentType } from '../../../shared/services/student.service';
import { statusStudentService, type StatusStudent } from '../../../shared/services/statusStudent.service';
import dayjs from 'dayjs';

interface AddStudentProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: StudentType | null;
}

export const AddStudent: React.FC<AddStudentProps> = ({ open, onClose, onSuccess, student }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statusList, setStatusList] = useState<StatusStudent[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isEdit = !!student;

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setLoadingStatus(true);
        const statuses = await statusStudentService.list();
        setStatusList(statuses.filter((s) => s.active));
      } catch (err: any) {
        message.error('Erro ao carregar status');
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchData();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (student) {
      // Usar dados do objeto user
      const name = student.user?.name || '';
      const email = student.user?.email || '';
      
      // Usar dados do objeto address se existir, senão usar campos diretos
      const address = student.address || {};
      
      form.setFieldsValue({
        name,
        email,
        cpf: student.cpf,
        rg: student.rg,
        birth_date: student.birth_date ? dayjs(student.birth_date) : null,
        phone: student.phone,
        address_street: address.street || student.address_street,
        address_number: address.number || student.address_number,
        address_neighborhood: address.neighborhood || student.address_neighborhood,
        address_city: address.city || student.address_city,
        address_state: address.state || student.address_state,
        address_zip: address.zip || student.address_zip,
        category: student.category,
        status_students_id: student.status?.id || student.status_students_id,
      });

      if (student.photo_url) {
        setFileList([
          {
            uid: '-1',
            name: 'Foto atual',
            status: 'done',
            url: student.photo_url,
          },
        ]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [open, student, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Adicionar campos do formulário
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('cpf', values.cpf);
      if (values.rg) formData.append('rg', values.rg);
      formData.append('birth_date', dayjs(values.birth_date).format('YYYY-MM-DD'));
      if (values.phone) formData.append('phone', values.phone);
      if (values.address_street) formData.append('address_street', values.address_street);
      if (values.address_number) formData.append('address_number', values.address_number);
      if (values.address_neighborhood) formData.append('address_neighborhood', values.address_neighborhood);
      if (values.address_city) formData.append('address_city', values.address_city);
      if (values.address_state) formData.append('address_state', values.address_state);
      if (values.address_zip) formData.append('address_zip', values.address_zip);
      if (values.category) formData.append('category', values.category);
      if (values.status_students_id) formData.append('status_students_id', values.status_students_id);

      // Adicionar foto se houver
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('photo', fileList[0].originFileObj);
      }

      if (isEdit && student?.id) {
        await studentService.updateWithPhoto(student.id, formData);
        message.success('Aluno atualizado com sucesso!');
      } else {
        await studentService.createWithPhoto(formData);
        message.success('Aluno criado com sucesso!');
      }

      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const beforeUpload = () => {
    return false; // Impede upload automático
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Formatação de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      }
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    return value;
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  return (
    <Modal
      title={isEdit ? 'Editar Aluno' : 'Novo Aluno'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Nome Completo"
              rules={[{ required: true, message: 'Insira o nome completo' }]}
            >
              <Input placeholder="Nome completo do aluno" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Insira o email' },
                { type: 'email', message: 'Email inválido' },
              ]}
            >
              <Input placeholder="email@exemplo.com" type="email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="cpf"
              label="CPF"
              rules={[
                { required: true, message: 'Insira o CPF' },
                {
                  pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                  message: 'CPF deve estar no formato XXX.XXX.XXX-XX',
                },
              ]}
            >
              <Input
                placeholder="000.000.000-00"
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  form.setFieldsValue({ cpf: formatted });
                }}
                maxLength={14}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="rg" label="RG">
              <Input placeholder="RG do aluno" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="birth_date"
              label="Data de Nascimento"
              rules={[{ required: true, message: 'Selecione a data de nascimento' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Telefone/WhatsApp">
              <Input
                placeholder="(00) 00000-0000"
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  form.setFieldsValue({ phone: formatted });
                }}
                maxLength={15}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item name="address_street" label="Rua">
              <Input placeholder="Nome da rua" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="address_number" label="Número">
              <Input placeholder="Número" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="address_neighborhood" label="Bairro">
              <Input placeholder="Bairro" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="address_city" label="Cidade">
              <Input placeholder="Cidade" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="address_state" label="Estado">
              <Input placeholder="SP" maxLength={2} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="address_zip" label="CEP">
              <Input
                placeholder="00000-000"
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value);
                  form.setFieldsValue({ address_zip: formatted });
                }}
                maxLength={9}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="category" label="Categoria">
              <Select placeholder="Selecione a categoria" allowClear>
                <Select.Option value="A">A</Select.Option>
                <Select.Option value="B">B</Select.Option>
                <Select.Option value="C">C</Select.Option>
                <Select.Option value="D">D</Select.Option>
                <Select.Option value="AB">AB</Select.Option>
                <Select.Option value="AC">AC</Select.Option>
                <Select.Option value="AD">AD</Select.Option>
                <Select.Option value="AE">AE</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="status_students_id" label="Status">
              <Select
                placeholder="Selecione o status"
                loading={loadingStatus}
                allowClear
                options={statusList.map((status) => ({
                  value: status.id,
                  label: status.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Foto do Aluno">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}
            accept="image/*"
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

