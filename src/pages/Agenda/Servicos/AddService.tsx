import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col, message, DatePicker } from 'antd';
import { serviceService, type Service as ServiceType, type CreateServiceRequest, type UpdateServiceRequest } from '../../../shared/services/service.service';
import { moduleService, type Module } from '../../../shared/services/module.service';
import { toBRL, fromBRL } from '../../../shared/utils/currency';
import dayjs from 'dayjs';

interface AddServiceProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: ServiceType | null;
}

export const AddService: React.FC<AddServiceProps> = ({ open, onClose, onSuccess, service }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [hasPrice, setHasPrice] = useState(false);

  const isEdit = !!service;

  useEffect(() => {
    if (!open) return;

    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        const data = await moduleService.listServices();
        setModules(data);
      } catch (err: any) {
        message.error('Erro ao carregar módulos');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (service) {
      const hasPriceValue = !!service.price;
      setHasPrice(hasPriceValue);
      
      form.setFieldsValue({
        module_id: service.module_id,
        name: service.name,
        slug: service.slug,
        duration_minutes: service.duration_minutes,
        active: service.active !== undefined ? service.active : true,
        price: service.price?.price,
        price_active: service.price ? true : false,
        price_start_date: service.price?.start_date ? dayjs(service.price.start_date) : null,
        price_end_date: service.price?.end_date ? dayjs(service.price.end_date) : null,
      });
    } else {
      form.resetFields();
      setHasPrice(false);
      form.setFieldsValue({
        active: true,
        price_active: true,
      });
    }
  }, [open, service, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (isEdit && service?.id) {
        const payload: UpdateServiceRequest = {
          module_id: values.module_id,
          name: values.name,
          slug: values.slug,
          duration_minutes: values.duration_minutes,
          active: values.active,
        };

        // Se tem preço, adiciona os campos de preço
        if (hasPrice && values.price !== undefined && values.price !== null) {
          payload.price = values.price;
          payload.currency = 'BRL';
          payload.price_active = values.price_active !== undefined ? values.price_active : true;
          payload.price_start_date = values.price_start_date ? values.price_start_date.format('YYYY-MM-DD') : null;
          payload.price_end_date = values.price_end_date ? values.price_end_date.format('YYYY-MM-DD') : null;
          payload.update_price = true;
        }

        await serviceService.update(service.id, payload as any);
        message.success('Serviço atualizado com sucesso!');
      } else {
        const payload: CreateServiceRequest = {
          module_id: values.module_id,
          name: values.name,
          slug: values.slug,
          duration_minutes: values.duration_minutes,
          active: values.active !== undefined ? values.active : true,
        };

        // Se tem preço, adiciona os campos de preço
        if (hasPrice && values.price !== undefined && values.price !== null) {
          payload.price = values.price;
          payload.currency = 'BRL';
          payload.price_active = values.price_active !== undefined ? values.price_active : true;
          payload.price_start_date = values.price_start_date ? values.price_start_date.format('YYYY-MM-DD') : null;
          payload.price_end_date = values.price_end_date ? values.price_end_date.format('YYYY-MM-DD') : null;
        }

        await serviceService.create(payload as any);
        message.success('Serviço criado com sucesso!');
      }

      form.resetFields();
      setHasPrice(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao salvar serviço';
      const errors = err.response?.data?.errors;
      
      if (errors) {
        const errorText = Object.values(errors).flat().join(', ');
        message.error(errorText);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    form.setFieldsValue({ slug });
  };

  const parsePrice = (v: string | undefined): number => {
    return fromBRL(v ?? '0');
  };

  return (
    <Modal
      title={isEdit ? 'Editar Serviço' : 'Novo Serviço'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="module_id"
              label="Módulo"
              rules={[{ required: true, message: 'Selecione o módulo' }]}
            >
              <Select
                placeholder="Selecione o módulo"
                loading={loadingModules}
                showSearch
                optionFilterProp="label"
                options={modules.map((module) => ({
                  value: module.id,
                  label: module.name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Nome"
              rules={[{ required: true, message: 'Insira o nome do serviço' }]}
            >
              <Input placeholder="Nome do serviço" onChange={handleNameChange} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="slug"
              label="Slug"
              rules={[{ required: true, message: 'Insira o slug' }]}
            >
              <Input placeholder="slug-do-servico" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="duration_minutes"
              label="Duração (minutos)"
              rules={[
                { required: true, message: 'Insira a duração' },
                { type: 'number', min: 1, message: 'A duração deve ser no mínimo 1 minuto' },
              ]}
            >
              <InputNumber
                placeholder="50"
                min={1}
                style={{ width: '100%' }}
                addonAfter="min"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="active"
              label="Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Preço">
          <Switch
            checked={hasPrice}
            onChange={(checked) => {
              setHasPrice(checked);
              if (!checked) {
                form.setFieldsValue({
                  price: undefined,
                  price_start_date: null,
                  price_end_date: null,
                });
              }
            }}
            checkedChildren="Com preço"
            unCheckedChildren="Sem preço"
          />
        </Form.Item>

        {hasPrice && (
          <>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="price"
                  label="Preço"
                  rules={[
                    { required: true, message: 'Insira o preço' },
                    { type: 'number', min: 0, message: 'O preço deve ser maior ou igual a 0' },
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0,00"
                    formatter={(v) => `R$ ${toBRL(v ?? 0)}`}
                    parser={parsePrice}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="price_start_date"
                  label="Data de Início da Vigência"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Selecione a data de início"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="price_end_date"
                  label="Data de Fim da Vigência"
                  dependencies={['price_start_date']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startDate = getFieldValue('price_start_date');
                        if (!value || !startDate) {
                          return Promise.resolve();
                        }
                        if (value.isBefore(startDate)) {
                          return Promise.reject(new Error('A data de fim deve ser maior ou igual à data de início'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Selecione a data de fim"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="price_active"
              label="Preço Ativo"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

