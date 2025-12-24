import { useState, useEffect } from 'react';
import { Form, Row, Col, TimePicker, Switch, Button, Card, message, Space, Spin, Select } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { availabilityService, type Availability } from '../../../shared/services/availability.service';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { providerService, type Provider } from '../../../shared/services/provider.service';

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface DisponibilidadesProfissionalProps {
  providerId?: number | string;
}

export const DisponibilidadesProfissional: React.FC<DisponibilidadesProfissionalProps> = ({ providerId: propProviderId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | string | undefined>(propProviderId);
  const { user, isTenant } = useAuth();

  // Se for admin, precisa selecionar o profissional
  const isAdmin = isTenant();

  useEffect(() => {
    if (isAdmin) {
      loadProviders();
    } else {
      // Se for profissional, buscar seu próprio provider_id
      loadMyProviderId();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedProviderId) {
      loadAvailabilities();
    }
  }, [selectedProviderId]);

  const loadProviders = async () => {
    try {
      const data = await providerService.list();
      setProviders(data);
      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
      }
    } catch (error: any) {
      message.error('Erro ao carregar profissionais');
    }
  };

  const loadMyProviderId = async () => {
    try {
      const data = await providerService.list();
      const myProvider = data.find((p) => p.user?.id === user?.id);
      if (myProvider?.id) {
        setSelectedProviderId(myProvider.id);
      } else {
        message.error('Profissional não encontrado');
      }
    } catch (error: any) {
      message.error('Erro ao carregar dados do profissional');
    }
  };

  const loadAvailabilities = async () => {
    if (!selectedProviderId) return;

    try {
      setLoading(true);
      const availabilities = await availabilityService.list(selectedProviderId);

      // Criar um objeto com as disponibilidades por weekday
      const availabilitiesByWeekday: Record<number, Availability> = {};
      availabilities.forEach((availability) => {
        availabilitiesByWeekday[availability.weekday] = availability;
      });

      // Preparar valores do formulário
      const formValues: Record<string, any> = {};
      WEEKDAYS.forEach((day) => {
        const availability = availabilitiesByWeekday[day.value];
        const key = `day_${day.value}`;
        formValues[key] = {
          active: availability?.active ?? false,
          start_time: availability?.start_time ? dayjs(availability.start_time, 'HH:mm:ss') : null,
          end_time: availability?.end_time ? dayjs(availability.end_time, 'HH:mm:ss') : null,
        };
      });

      form.setFieldsValue(formValues);
    } catch (error: any) {
      console.error('Erro ao carregar disponibilidades:', error);
      message.error('Erro ao carregar disponibilidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProviderId) {
      message.error('Selecione um profissional');
      return;
    }

    try {
      const values = await form.validateFields();
      setSaving(true);

      // Preparar dados para sincronização
      const businessHours = WEEKDAYS.map((day) => {
        const key = `day_${day.value}`;
        const dayData = values[key] || {};

        return {
          weekday: day.value,
          start_time: dayData.start_time
            ? dayData.start_time.format('HH:mm:ss')
            : '09:00:00',
          end_time: dayData.end_time
            ? dayData.end_time.format('HH:mm:ss')
            : '18:00:00',
          active: dayData.active ?? false,
        };
      });

      await availabilityService.sync(selectedProviderId, { business_hours: businessHours });
      message.success('Disponibilidades salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar disponibilidades:', error);
      if (error?.errorFields) {
        // Erro de validação do formulário
        message.error('Por favor, verifique os campos do formulário');
      } else {
        message.error(error?.response?.data?.message || 'Erro ao salvar disponibilidades');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = (weekday: number) => {
    const key = `day_${weekday}`;
    const dayData = form.getFieldValue(key);
    
    if (!dayData?.start_time || !dayData?.end_time) {
      message.warning('Configure primeiro o horário deste dia');
      return;
    }

    // Aplicar o mesmo horário para todos os dias
    WEEKDAYS.forEach((day) => {
      if (day.value !== weekday) {
        form.setFieldValue(`day_${day.value}`, {
          active: dayData.active,
          start_time: dayData.start_time,
          end_time: dayData.end_time,
        });
      }
    });

    message.success('Horário aplicado para todos os dias');
  };

  if (!selectedProviderId && !isAdmin) {
    return (
      <Card>
        <p>Carregando dados do profissional...</p>
      </Card>
    );
  }

  return (
    <Spin spinning={loading}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isAdmin && (
            <Form.Item label="Profissional">
              <Select
                value={selectedProviderId}
                onChange={(value) => setSelectedProviderId(value)}
                placeholder="Selecione o profissional"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={providers.map((provider) => ({
                  value: provider.id,
                  label: provider.user?.name || `Profissional ${provider.id}`,
                }))}
              />
            </Form.Item>
          )}

          <Form form={form} layout="vertical">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {WEEKDAYS.map((day) => {
                const key = `day_${day.value}`;
                return (
                  <Card key={day.value} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                      <Col xs={24} sm={4}>
                        <strong>{day.label}</strong>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          name={[key, 'active']}
                          valuePropName="checked"
                          initialValue={false}
                        >
                          <Switch checkedChildren="Ativo" unCheckedChildren="Fechado" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues[key]?.active !== currentValues[key]?.active
                          }
                        >
                          {() => {
                            const isActive = form.getFieldValue([key, 'active']);
                            return (
                              <Form.Item
                                name={[key, 'start_time']}
                                label="Horário de Abertura"
                                dependencies={[[key, 'active']]}
                                rules={[
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const dayData = getFieldValue(key);
                                      if (dayData?.active && !value) {
                                        return Promise.reject('Selecione o horário de abertura');
                                      }
                                      return Promise.resolve();
                                    },
                                  }),
                                ]}
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                  placeholder="Abertura"
                                  disabled={!isActive}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues[key]?.active !== currentValues[key]?.active
                          }
                        >
                          {() => {
                            const isActive = form.getFieldValue([key, 'active']);
                            return (
                              <Form.Item
                                name={[key, 'end_time']}
                                label="Horário de Fechamento"
                                dependencies={[[key, 'start_time'], [key, 'active']]}
                                rules={[
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const dayData = getFieldValue(key);
                                      if (dayData?.active && !value) {
                                        return Promise.reject('Selecione o horário de fechamento');
                                      }
                                      const startTime = dayData?.start_time;
                                      if (dayData?.active && startTime && value && value.isBefore(startTime)) {
                                        return Promise.reject('Horário de fechamento deve ser após o de abertura');
                                      }
                                      return Promise.resolve();
                                    },
                                  }),
                                ]}
                              >
                                <TimePicker
                                  format="HH:mm"
                                  style={{ width: '100%' }}
                                  placeholder="Fechamento"
                                  disabled={!isActive}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={2}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues[key]?.active !== currentValues[key]?.active
                          }
                        >
                          {() => {
                            const isActive = form.getFieldValue([key, 'active']);
                            return (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleApplyToAll(day.value)}
                                disabled={!isActive}
                              >
                                Aplicar a todos
                              </Button>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                );
              })}

              <Row justify="end" style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  loading={saving}
                  size="large"
                >
                  Salvar Disponibilidades
                </Button>
              </Row>
            </Space>
          </Form>
        </Space>
      </Card>
    </Spin>
  );
};
