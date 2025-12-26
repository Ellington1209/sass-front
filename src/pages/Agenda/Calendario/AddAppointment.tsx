import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, message, Row, Col } from 'antd';
import { appointmentService, type Appointment, type AppointmentCreatePayload } from '../../../shared/services/appointment.service';
import { providerService, type Provider } from '../../../shared/services/provider.service';
import { serviceService, type Service } from '../../../shared/services/service.service';
import { clientService, type Client } from '../../../shared/services/client.service';
import { statusAgendaService, type StatusAgenda } from '../../../shared/services/statusAgenda.service';
import { apiService } from '../../../shared/services/api.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/pt-br';

dayjs.extend(utc);
dayjs.locale('pt-br');

const { TextArea } = Input;

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

interface AddAppointmentProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment | null;
  selectedDate?: string | null;
  userType: 'admin' | 'provider' | 'client';
  userData: UserData | null;
}

export const AddAppointment: React.FC<AddAppointmentProps> = ({
  open,
  onClose,
  onSuccess,
  appointment,
  selectedDate,
  userType,
  userData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusList, setStatusList] = useState<StatusAgenda[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(undefined);
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>(undefined);
  
  // Verificar se tem módulo auto-escola
  const modules = apiService.getModules();
  const hasAutoEscola = modules.some((module) => module.toLowerCase().includes('auto-escola') || module.toLowerCase().includes('autoescola'));
  const clientLabel = hasAutoEscola ? 'Aluno' : 'Cliente';

  const isEdit = !!appointment;

  // Carregar dados iniciais
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      // Profissionais (exceto para profissionais que só veem os próprios)
      if (userType !== 'provider') {
        try {
          setLoadingProviders(true);
          const providersData = await providerService.list();
          setProviders(providersData);
        } catch (err: any) {
          message.error('Erro ao carregar profissionais');
        } finally {
          setLoadingProviders(false);
        }
      } else if (userData) {
        // Profissional: carregar apenas o próprio perfil
        try {
          setLoadingProviders(true);
          const providersData = await providerService.list();
          const myProvider = providersData.find((p) => p.user?.id === userData.id);
          if (myProvider) {
            setProviders([myProvider]);
            setSelectedProviderId(myProvider.id);
          }
        } catch (err: any) {
          message.error('Erro ao carregar profissional');
        } finally {
          setLoadingProviders(false);
        }
      }

      try {
        setLoadingServices(true);
        const servicesData = await serviceService.list();
        setServices(servicesData.filter((s) => s.active !== false));
      } catch (err: any) {
        message.error('Erro ao carregar serviços');
      } finally {
        setLoadingServices(false);
      }

      // Clientes (apenas admin pode escolher cliente)
      if (userType === 'admin' || userType === 'provider') {
        try {
          setLoadingClients(true);
          const clientsData = await clientService.list();
          setClients(clientsData);
        } catch (err: any) {
          message.error(`Erro ao carregar ${clientLabel.toLowerCase()}s`);
        } finally {
          setLoadingClients(false);
        }
      }

      // Carregar status apenas na edição
      if (isEdit) {
        try {
          setLoadingStatus(true);
          const statusData = await statusAgendaService.list();
          setStatusList(statusData.filter((s) => s.active !== false));
        } catch (err: any) {
          console.error('Erro ao carregar status de agenda:', err);
          message.error('Erro ao carregar status de agenda');
          setStatusList([]);
        } finally {
          setLoadingStatus(false);
        }
      }
    };

    fetchData();
  }, [open, userType, userData, isEdit]);

  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (!open) return;

    if (appointment && appointment.id) {
      form.setFieldsValue({
        service_id: appointment.service_id,
        provider_id: appointment.provider_id,
        client_id: appointment.client_id,
        // Converter data do backend para exibição no DatePicker
        date_start: appointment.date_start ? dayjs(appointment.date_start) : null,
        status_agenda_id: appointment.status_agenda_id,
        notes: appointment.notes || '',
      });
      setSelectedServiceId(appointment.service_id);
      setSelectedProviderId(appointment.provider_id);
    } else if (selectedDate) {
      form.setFieldsValue({
        date_start: dayjs(selectedDate),
      });
    } else {
      form.resetFields();
      setSelectedServiceId(undefined);
      setSelectedProviderId(undefined);
    }
  }, [open, appointment, selectedDate, form]);

  // Filtrar serviços disponíveis para o profissional selecionado
  // Para admin: mostra todos os serviços se não tiver profissional selecionado
  // Para outros: filtra pelos serviços do profissional
  const availableServices = selectedProviderId
    ? services.filter((service) => {
        const provider = providers.find((p) => p.id === selectedProviderId);
        if (!provider) return false;
        return provider.service_ids?.includes(service.id!) || false;
      })
    : userType === 'admin'
    ? services // Admin pode ver todos os serviços
    : services; // Fallback: todos os serviços

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Formatar data para enviar ao backend (assumindo timezone local)
      const dateStart = dayjs(values.date_start).format('YYYY-MM-DD HH:mm:ss');

      // Para cliente, usar o próprio ID como client_id
      let clientId = values.client_id;
      if (userType === 'client' && userData) {
        clientId = userData.id;
      }

      // Para profissional, usar o próprio ID como provider_id
      let providerId = values.provider_id;
      if (userType === 'provider' && selectedProviderId) {
        providerId = selectedProviderId;
      }

      const payload: AppointmentCreatePayload = {
        service_id: values.service_id,
        provider_id: providerId,
        client_id: clientId,
        date_start: dateStart,
        status_agenda_id: isEdit ? (values.status_agenda_id || null) : null,
        notes: values.notes || null,
      };

      if (isEdit && appointment?.id) {
        await appointmentService.update(appointment.id, payload);
        message.success('Agendamento atualizado com sucesso!');
      } else {
        await appointmentService.create(payload);
        message.success('Agendamento criado com sucesso!');
      }

      form.resetFields();
      setSelectedServiceId(undefined);
      setSelectedProviderId(undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao salvar agendamento';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (value: number) => {
    setSelectedServiceId(value);
  };

  const handleProviderChange = (value: number) => {
    setSelectedProviderId(value);
    // Limpar serviço selecionado se não estiver disponível para o novo profissional
    if (selectedServiceId) {
      const provider = providers.find((p) => p.id === value);
      if (provider && !provider.service_ids?.includes(selectedServiceId)) {
        form.setFieldsValue({ service_id: undefined });
        setSelectedServiceId(undefined);
      }
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="provider_id"
              label="Profissional"
              rules={[{ required: true, message: 'Selecione o profissional' }]}
            >
              <Select
                placeholder="Selecione o profissional"
                loading={loadingProviders}
                showSearch
                optionFilterProp="label"
                onChange={handleProviderChange}
                disabled={userType === 'provider'}
                options={providers.map((provider) => ({
                  value: provider.id,
                  label: provider.user?.name || `Profissional ${provider.id}`,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="service_id"
              label="Serviço"
              rules={[{ required: true, message: 'Selecione o serviço' }]}
            >
              <Select
                placeholder="Selecione o serviço"
                loading={loadingServices}
                showSearch
                optionFilterProp="label"
                onChange={handleServiceChange}
                options={availableServices.map((service) => ({
                  value: service.id,
                  label: service.name,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {(userType === 'admin' || userType === 'provider') && (
            <Col xs={24} sm={12}>
              <Form.Item
                name="client_id"
                label={clientLabel}
                rules={[{ required: true, message: `Selecione o ${clientLabel.toLowerCase()}` }]}
              >
                <Select
                  placeholder={`Selecione o ${clientLabel.toLowerCase()}`}
                  loading={loadingClients}
                  showSearch
                  optionFilterProp="label"
                  options={clients.map((client) => ({
                    value: client.user?.id || client.id,
                    label: `${client.user?.name || 'Sem nome'} (${client.user?.email || 'Sem email'})`,
                  }))}
                />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={userType === 'client' ? 24 : 12}>
            <Form.Item
              name="date_start"
              label="Data e Hora de Início"
              rules={[{ required: true, message: 'Selecione a data e hora' }]}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                placeholder="Selecione a data e hora"
              />
            </Form.Item>
          </Col>
        </Row>

        {isEdit && (
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="status_agenda_id" label="Status">
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
        )}

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="notes" label="Observações">
              <TextArea rows={4} placeholder="Observações sobre o agendamento" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
