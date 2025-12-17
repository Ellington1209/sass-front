import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Upload, message, Row, Col, Tag, Space, Typography } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { providerService, type Provider as ProviderType } from '../../../../shared/services/provider.service';
import { adminServiceService, type AdminService } from '../../../../shared/services/adminService.service';
import { userService } from '../../../../shared/services/user.service';
import dayjs from 'dayjs';

const { Text } = Typography;

interface AddProviderProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider?: ProviderType | null;
}

export const AddProvider: React.FC<AddProviderProps> = ({ open, onClose, onSuccess, provider }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [servicesList, setServicesList] = useState<AdminService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isEdit = !!provider;

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setLoadingServices(true);
        const services = await adminServiceService.list();
        setServicesList(services);
      } catch (err: any) {
        message.error('Erro ao carregar serviços');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchData();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadProviderData = async () => {
      if (provider && provider.id) {
        try {
          let providerData = provider;
          if (!provider.user && provider.user_id) {
            try {
              const fullProvider = await providerService.getById(provider.id);
              if (fullProvider.user) {
                providerData = fullProvider;
              } else if (provider.user_id) {
                try {
                  const user = await userService.getById(provider.user_id);
                  providerData = {
                    ...providerData,
                    user: {
                      id: user.id!,
                      name: user.name,
                      email: user.email,
                    },
                  };
                } catch (err) {
                  console.error('Erro ao buscar usuário:', err);
                }
              }
            } catch (err) {
              console.error('Erro ao buscar provider completo:', err);
            }
          }

          const person = providerData.person;
          const cpf = person?.cpf || providerData.cpf || '';
          const rg = person?.rg || providerData.rg || null;
          const birthDate = person?.birth_date || providerData.birth_date;
          const phone = person?.phone || providerData.phone || '';
          
          const address = person?.address || providerData.address || {};
          
          form.setFieldsValue({
            name: providerData.user?.name || '',
            email: providerData.user?.email || '',
            cpf,
            rg,
            birth_date: birthDate ? dayjs(birthDate) : null,
            phone,
            address_street: address.street || providerData.address_street,
            address_number: address.number || providerData.address_number,
            address_neighborhood: address.neighborhood || providerData.address_neighborhood,
            address_city: address.city || providerData.address_city,
            address_state: address.state || providerData.address_state,
            address_zip: address.zip || providerData.address_zip,
            service_ids: providerData.service_ids || [],
          });

          if (providerData.photo_url) {
            setFileList([
              {
                uid: '-1',
                name: 'Foto atual',
                status: 'done',
                url: providerData.photo_url,
              },
            ]);
          }
        } catch (err) {
          console.error('Erro ao carregar dados do profissional:', err);
        }
      } else {
        form.resetFields();
        setFileList([]);
      }
    };

    loadProviderData();
  }, [open, provider, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const formData = new FormData();

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
      
      // Adicionar service_ids como array
      if (values.service_ids && Array.isArray(values.service_ids)) {
        values.service_ids.forEach((id: number, index: number) => {
          formData.append(`service_ids[${index}]`, id.toString());
        });
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('photo', fileList[0].originFileObj);
      }

      if (isEdit && provider?.id) {
        await providerService.updateWithPhoto(provider.id, formData);
        message.success('Profissional atualizado com sucesso!');
      } else {
        await providerService.createWithPhoto(formData);
        message.success('Profissional criado com sucesso!');
      }

      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao salvar profissional');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const beforeUpload = () => {
    return false;
  };

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

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  return (
    <Modal
      title={isEdit ? 'Editar Profissional' : 'Novo Profissional'}
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
              <Input placeholder="Nome completo do profissional" />
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
              <Input placeholder="RG do profissional" />
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
              <Input placeholder="GO" maxLength={2} />
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
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              name="service_ids"
              label="Serviços"
            >
              <Select
                mode="multiple"
                placeholder="Selecione os serviços"
                loading={loadingServices}
                showSearch
                allowClear
                optionFilterProp="value"
                filterOption={(input, option) => {
                  const service = servicesList.find((s) => s.id === option?.value);
                  if (!service) return false;
                  const text = `${service.name} ${service.slug || ''}`.toLowerCase();
                  return text.includes(input.toLowerCase());
                }}
                tagRender={({ value, onClose, closable }) => {
                  const service = servicesList.find((s) => s.id === value);
                  return (
                    <Tag color="blue" closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
                      {service?.name || value}
                    </Tag>
                  );
                }}
                options={servicesList.map((service) => ({
                  value: service.id,
                  label: (
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text strong>{service.name}</Text>
                    </Space>
                  )
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Foto do Profissional">
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

