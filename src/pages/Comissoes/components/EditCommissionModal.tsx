import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Select, message, Space, Typography, Divider, Switch } from 'antd';
import { PercentageOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Provider } from '../../../shared/services/provider.service';
import { providerService } from '../../../shared/services/provider.service';
import { commissionService, type CommissionConfig } from '../../../shared/services/commission.service';
import { serviceService, type Service } from '../../../shared/services/service.service';

const { Text } = Typography;
const { Option } = Select;

interface EditCommissionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  provider: Provider | null;
  config: CommissionConfig | null;
}

export const EditCommissionModal: React.FC<EditCommissionModalProps> = ({
  open,
  onClose,
  onSuccess,
  provider,
  config,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const isEdit = !!config;
  const isNewWithoutProvider = !provider && !config;

  useEffect(() => {
    if (!open) return;

    // Buscar serviços e profissionais
    const fetchOptions = async () => {
      try {
        setLoadingServices(true);
        setLoadingProviders(true);
        
        const [servicesData, providersData] = await Promise.all([
          serviceService.list({ active: true }).catch(() => []),
          providerService.list().catch(() => [])
        ]);
        
        setServices(servicesData);
        setProviders(providersData);
      } catch (error: any) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setLoadingServices(false);
        setLoadingProviders(false);
      }
    };

    fetchOptions();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (config) {
      // Se já existe configuração, carregar dados
      form.setFieldsValue({
        provider_id: config.provider_id,
        service_id: config.service_id || undefined,
        commission_rate: config.commission_rate,
        active: config.active !== false,
      });
    } else {
      // Se não existe, resetar formulário
      form.resetFields();
      form.setFieldsValue({
        provider_id: provider?.id || undefined,
        service_id: undefined,
        commission_rate: undefined,
        active: true,
      });
    }
  }, [open, config, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Obter provider_id (pode vir do provider selecionado ou do formulário)
      const providerId = provider?.id || values.provider_id;
      
      if (!providerId) {
        message.error('Selecione um profissional');
        return;
      }

      if (isEdit && config?.id) {
        // Atualizar configuração existente
        await commissionService.updateConfig(config.id, {
          commission_rate: values.commission_rate,
          active: values.active,
        });
        message.success('Configuração atualizada com sucesso!');
      } else {
        // Criar nova configuração
        await commissionService.createConfig({
          provider_id: providerId,
          service_id: values.service_id || null,
          origin_id: null, // Sempre null, não usamos mais origem
          commission_rate: values.commission_rate,
          active: values.active !== false,
        });
        message.success('Configuração criada com sucesso!');
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      if (error?.errorFields) {
        message.error('Por favor, verifique os campos do formulário');
      } else {
        message.error(error?.response?.data?.message || 'Erro ao salvar configuração');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSpecificityInfo = () => {
    const serviceId = form.getFieldValue('service_id');

    if (serviceId) {
      return {
        level: 1,
        text: 'Específica por serviço: Aplicará apenas para este serviço',
        color: 'blue',
      };
    }
    return {
      level: 2,
      text: 'Configuração padrão: Aplicará para todos os serviços quando não houver configuração mais específica',
      color: 'default',
    };
  };

  const specificityInfo = getSpecificityInfo();

  return (
    <Modal
      title={
        <Space>
          <Text strong>
            {isEdit ? 'Editar Configuração de Comissão' : 'Nova Configuração de Comissão'}
          </Text>
          {provider && !isNewWithoutProvider && (
            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
              - {provider.user?.name || 'Profissional'}
            </Text>
          )}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          active: true,
        }}
      >
        {isNewWithoutProvider && (
          <Form.Item
            name="provider_id"
            label="Profissional"
            rules={[{ required: true, message: 'Selecione um profissional' }]}
          >
            <Select
              placeholder="Selecione um profissional"
              loading={loadingProviders}
              showSearch
              filterOption={(input, option) => {
                const label = String(option?.label || option?.children || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {providers.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.user?.name || `ID: ${p.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="service_id"
          label="Serviço (Opcional)"
          extra="Deixe em branco para aplicar a todos os serviços. Selecione um serviço específico para configurar apenas para ele."
        >
          <Select
            placeholder="Todos os serviços"
            allowClear
            loading={loadingServices}
            showSearch
            filterOption={(input, option) => {
              const label = String(option?.label || option?.children || '');
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {services.map((service) => (
              <Option key={service.id} value={service.id}>
                {service.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item
          name="commission_rate"
          label="Taxa de Comissão (%)"
          rules={[
            { required: true, message: 'Informe a taxa de comissão' },
            { type: 'number', min: 0, max: 100, message: 'A taxa deve estar entre 0 e 100%' },
          ]}
          extra="Informe a porcentagem que o profissional receberá sobre cada serviço prestado"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={100}
            step={0.1}
            precision={2}
            placeholder="Ex: 30.5"
            addonAfter={<PercentageOutlined />}
            formatter={(value) => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '')}
            parser={(value) => {
              if (!value) return 0 as 0 | 100;
              const cleaned = value.replace(/\$\s?|(,*)/g, '');
              const num = parseFloat(cleaned);
              if (isNaN(num)) return 0 as 0 | 100;
              // Garantir que está entre 0 e 100
              const clamped = Math.max(0, Math.min(100, num));
              return clamped as 0 | 100;
            }}
          />
        </Form.Item>

        <Form.Item
          name="active"
          label="Status"
          valuePropName="checked"
        >
          <Switch checkedChildren="Ativa" unCheckedChildren="Inativa" />
        </Form.Item>

        <div style={{ 
          padding: '12px', 
          background: '#f0f2f5', 
          borderRadius: '4px',
          marginTop: '8px'
        }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <Text strong style={{ color: specificityInfo.color }}>
                {specificityInfo.text}
              </Text>
            </Text>
          </Space>
        </div>

        {form.getFieldValue('commission_rate') && (
          <div style={{ 
            padding: '12px', 
            background: '#e6f7ff', 
            borderRadius: '4px',
            marginTop: '8px',
            border: '1px solid #91d5ff'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>Exemplo:</strong> Se um serviço custar R$ 100,00, o profissional receberá{' '}
              <strong>R$ {((form.getFieldValue('commission_rate') || 0) / 100 * 100).toFixed(2).replace('.', ',')}</strong>
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};
