import { useState, useEffect } from 'react';
import { Form, Row, Col, TimePicker, Switch, Button, Card, message, Space, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { businessHoursService, type BusinessHour } from '../../../shared/services/business-hours.service';
import { useAuth } from '../../../shared/contexts/AuthContext';

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export const HorarioFuncionamento = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const tenantId = user?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    loadBusinessHours();
  }, [tenantId]);

  const loadBusinessHours = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const hours = await businessHoursService.list(tenantId);

      // Criar um objeto com os horários por weekday
      const hoursByWeekday: Record<number, BusinessHour> = {};
      hours.forEach((hour) => {
        hoursByWeekday[hour.weekday] = hour;
      });

      // Preparar valores do formulário
      const formValues: Record<string, any> = {};
      WEEKDAYS.forEach((day) => {
        const hour = hoursByWeekday[day.value];
        const key = `day_${day.value}`;
        formValues[key] = {
          active: hour?.active ?? false,
          start_time: hour?.start_time ? dayjs(hour.start_time, 'HH:mm:ss') : null,
          end_time: hour?.end_time ? dayjs(hour.end_time, 'HH:mm:ss') : null,
        };
      });

      form.setFieldsValue(formValues);
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      message.error('Erro ao carregar horários de funcionamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tenantId) {
      message.error('Tenant ID não encontrado');
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

      await businessHoursService.sync(tenantId, { business_hours: businessHours });
      message.success('Horários de funcionamento salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar horários:', error);
      if (error?.errorFields) {
        // Erro de validação do formulário
        message.error('Por favor, verifique os campos do formulário');
      } else {
        message.error(error?.response?.data?.message || 'Erro ao salvar horários de funcionamento');
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

  if (!tenantId) {
    return (
      <Card>
        <p>Tenant ID não encontrado. Apenas administradores de tenant podem acessar esta configuração.</p>
      </Card>
    );
  }

  return (
    <Spin spinning={loading}>
      <Card>
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
                Salvar Horários
              </Button>
            </Row>
          </Space>
        </Form>
      </Card>
    </Spin>
  );
};

