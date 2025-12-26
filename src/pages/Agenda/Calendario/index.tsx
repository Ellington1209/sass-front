import { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { Button, Space, Select, message, Spin, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { 
  appointmentService, 
  type Appointment,
  type AppointmentListResponse,
  type TenantBusinessHour,
  type ProviderAvailability,
  type ProviderBlock,
} from '../../../shared/services/appointment.service';
import { providerService, type Provider } from '../../../shared/services/provider.service';
import { AddAppointment } from './AddAppointment';
import { apiService } from '../../../shared/services/api.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import type { EventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
// Importar estilos customizados
import './calendario.scss';

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title } = Typography;

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
}

export const Calendario = () => {
  const { hasPermission } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businessHours, setBusinessHours] = useState<TenantBusinessHour[]>([]);
  const [availabilities, setAvailabilities] = useState<ProviderAvailability[]>([]);
  const [blocks, setBlocks] = useState<ProviderBlock[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentViewRange, setCurrentViewRange] = useState<{ start: Date; end: Date } | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const canCreate = hasPermission('agenda.appointments.create');
  const canEdit = hasPermission('agenda.appointments.edit');

  // Verificar se tem módulo auto-escola
  const modules = apiService.getModules();
  const hasAutoEscola = modules.some((module) => module.toLowerCase().includes('auto-escola') || module.toLowerCase().includes('autoescola'));
  const clientLabel = hasAutoEscola ? 'Aluno' : 'Cliente';

  // Obter dados do usuário do localStorage
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const data = JSON.parse(userDataStr);
        setUserData(data);
      } catch (error) {
        console.error('Erro ao parsear user_data:', error);
      }
    }
  }, []);

  // Determinar o tipo de usuário
  const getUserType = (): 'admin' | 'provider' | 'client' => {
    if (!userData) return 'admin';
    
    const role = userData.role.toLowerCase();
    
    if (role.includes('admin')) return 'admin';
    if (role.includes('profissional')) return 'provider';
    if (role.includes('cliente')) return 'client';
    
    return 'admin'; // fallback
  };

  const userType = getUserType();

  // Carregar profissionais (para todos os tipos de usuário)
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await providerService.list();
        setProviders(data);
      } catch (error: any) {
        message.error('Erro ao carregar profissionais: ' + (error.response?.data?.message || error.message));
      }
    };
    fetchProviders();
  }, []);

  // Carregar agendamentos
  const fetchAppointments = async (startDate?: Date, endDate?: Date) => {
    try {
      // Criar chave única para esta requisição
      const startStr = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '';
      const endStr = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '';
      const providerKey = selectedProvider?.toString() || '';
      const fetchKey = `${startStr}-${endStr}-${providerKey}`;
      
      // Evitar requisições duplicadas com a mesma chave
      if (lastFetchRef.current === fetchKey) {
        return;
      }
      
      lastFetchRef.current = fetchKey;
      
      setLoading(true);
      const params: any = {};

      // Filtrar por profissional selecionado (para todos os tipos de usuário)
      if (selectedProvider) {
        params.provider_id = selectedProvider;
      } else if (userType === 'provider' && userData) {
        // Profissional sem filtro: busca apenas seus agendamentos
        const providerData = await providerService.list();
        const myProvider = providerData.find((p) => p.user?.id === userData.id);
        if (myProvider) {
          params.provider_id = myProvider.id;
        }
      }

      // Adicionar filtros de data se fornecidos
      if (startDate) {
        params.date_start = dayjs(startDate).format('YYYY-MM-DD');
      }
      if (endDate) {
        params.date_end = dayjs(endDate).format('YYYY-MM-DD');
      }

      // Cliente: busca todos os agendamentos (para mostrar horários ocupados)
      const response: AppointmentListResponse = await appointmentService.list(params);
      setAppointments(response.appointments);
      setBusinessHours(response.tenant_business_hours || []);
      setAvailabilities(response.availabilities || []);
      setBlocks(response.blocks || []);
    } catch (error: any) {
      message.error('Erro ao carregar agendamentos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      // Limpar referência anterior quando provider ou userData mudar
      lastFetchRef.current = null;
      
      // Aguardar um pouco para o calendário estar montado
      const timer = setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          const view = calendarApi.view;
          fetchAppointments(view.activeStart, view.activeEnd);
        } else {
          // Se o calendário ainda não foi montado, buscar sem filtro de data
          fetchAppointments();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, userData]);

  // Função para obter cor por status
  const getColorByStatus = (statusId?: number | null): string => {
    if (!statusId) return '#1a73e8'; // Azul Google padrão
    
    switch (statusId) {
      case 1: return '#1a73e8'; // agendado - azul Google
      case 2: return '#34a853'; // confirmado - verde Google
      case 3: return '#ea4335'; // cancelado - vermelho Google
      case 4: return '#9c27b0'; // concluído - roxo
      default: return '#1a73e8';
    }
  };

  // Converter agendamentos para eventos do FullCalendar
  const formatEventForCalendar = (appointment: Appointment): EventInput | null => {
    if (!userData) return null;


    const start = dayjs(appointment.date_start).toDate();
    const end = appointment.date_end ? dayjs(appointment.date_end).toDate() : start;
    
    // Verificar se as datas são válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Data inválida para agendamento:', appointment);
      return null;
    }

    // Formatar título como tag
    const serviceName = (appointment.service as any)?.name || 'Serviço';
    const clientName = appointment.client?.name || clientLabel;
    const providerName = appointment.provider?.user?.name || 'Profissional';

    const statusColor = getColorByStatus(appointment.status_agenda_id);
    
    // Admin: vê tudo
    if (userType === 'admin') {
      return {
        id: appointment.id?.toString() || '',
        title: `${serviceName} - ${clientName}`,
        start,
        end,
        backgroundColor: statusColor,
        borderColor: statusColor,
        textColor: '#ffffff',
        classNames: ['fc-event-tag'],
        extendedProps: {
          appointment,
        },
      };
    }

    // Profissional: vê apenas seus agendamentos
    if (userType === 'provider') {
      const providerMatch = appointment.provider?.user?.id === userData.id;
      if (providerMatch) {
        return {
          id: appointment.id?.toString() || '',
          title: `${serviceName} - ${clientName}`,
          start,
          end,
          backgroundColor: statusColor,
          borderColor: statusColor,
          textColor: '#ffffff',
          classNames: ['fc-event-tag'],
          extendedProps: {
            appointment,
          },
        };
      }
      return null;
    }

    // Cliente: vê seus agendamentos completos e horários ocupados
    if (userType === 'client') {
      const isMyAppointment = appointment.client?.id === userData.id;

      if (isMyAppointment) {
        return {
          id: appointment.id?.toString() || '',
          title: `${serviceName} - ${providerName}`,
          start,
          end,
          backgroundColor: '#1a73e8',
          borderColor: '#1a73e8',
          textColor: '#ffffff',
          classNames: ['fc-event-tag'],
          extendedProps: {
            appointment,
          },
        };
      } else {
        return {
          id: `blocked-${appointment.id}`,
          title: '🔒 Horário Ocupado',
          start,
          end,
          backgroundColor: '#d9d9d9',
          borderColor: '#bfbfbf',
          textColor: '#5f6368',
          display: 'block',
          classNames: ['blocked-event'],
          extendedProps: {
            appointment: { ...appointment, isBlocked: true },
            blocked: true,
          },
        };
      }
    }

    return null;
  };

  // Filtrar availabilities pelo profissional selecionado
  const filteredAvailabilities = useMemo(() => {
    if (!selectedProvider) return [];
    return availabilities.filter((avail) => avail.provider_id === selectedProvider && avail.active);
  }, [availabilities, selectedProvider]);

  // Filtrar blocks pelo profissional selecionado
  const filteredBlocks = useMemo(() => {
    if (!selectedProvider) return blocks;
    return blocks.filter((block) => block.provider_id === selectedProvider);
  }, [blocks, selectedProvider]);

  // Verificar se um horário está disponível (considerando tenant + profissional)
  const isTimeSlotAvailable = useMemo(() => {
    return (date: dayjs.Dayjs): boolean => {
      const weekday = date.day(); // 0 = domingo, 1 = segunda, etc
      const hour = date.hour();
      const minute = date.minute();
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

      // Verificar horário de funcionamento do tenant
      const tenantHour = businessHours.find((bh) => bh.weekday === weekday && bh.active);
      if (!tenantHour) return false; // Fora do horário de funcionamento do tenant

      const tenantStart = tenantHour.start_time;
      const tenantEnd = tenantHour.end_time;
      if (timeStr < tenantStart || timeStr >= tenantEnd) return false; // Fora do horário do tenant

      // Se houver availabilities do profissional selecionado, verificar também
      if (filteredAvailabilities.length > 0) {
        const availability = filteredAvailabilities.find((a) => a.weekday === weekday);
        if (!availability) return false; // Profissional não disponível neste dia

        const availStart = availability.start_time;
        const availEnd = availability.end_time;
        if (timeStr < availStart || timeStr >= availEnd) return false; // Fora do horário do profissional
      } else if (selectedProvider) {
        // Se há profissional selecionado mas não há availabilities, considerar indisponível
        return false;
      }

      // Verificar se está em algum block
      const isBlocked = filteredBlocks.some((block) => {
        const blockStart = dayjs(block.start_at);
        const blockEnd = dayjs(block.end_at);
        return date.isSameOrAfter(blockStart) && date.isBefore(blockEnd);
      });

      return !isBlocked;
    };
  }, [businessHours, filteredAvailabilities, filteredBlocks, selectedProvider]);

  // Converter horários indisponíveis em eventos de bloqueio
  // COMENTADO: Não estamos mais mostrando horários indisponíveis, apenas bloqueios e agendamentos
  // Esta função não está sendo usada atualmente, mas foi mantida para possível uso futuro
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions
  const _formatUnavailableHoursAsEvents = useMemo((): EventInput[] => {
    const blockedEvents: EventInput[] = [];
    
    // Usar o período atual da view ou o período armazenado
    let startDate: dayjs.Dayjs;
    let endDate: dayjs.Dayjs;
    
    if (currentViewRange) {
      startDate = dayjs(currentViewRange.start);
      endDate = dayjs(currentViewRange.end);
    } else {
      return blockedEvents; // Sem período, não calcular
    }

    // Para cada dia no período visível
    let currentDate = startDate.startOf('day');
    const finalDate = endDate.endOf('day');
    
    while (currentDate.isBefore(finalDate) || currentDate.isSame(finalDate, 'day')) {
      const weekday = currentDate.day();
      
      // Verificar horário do tenant
      const tenantHour = businessHours.find((bh) => bh.weekday === weekday && bh.active);
      if (!tenantHour) {
        // Dia inteiro fora do funcionamento do tenant
        blockedEvents.push({
          id: `tenant-unavailable-${currentDate.format('YYYY-MM-DD')}`,
          title: 'Fora do horário de funcionamento',
          start: currentDate.startOf('day').toDate(),
          end: currentDate.endOf('day').toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
          classNames: ['fc-event-unavailable'],
          display: 'block',
          extendedProps: {
            isUnavailable: true,
            reason: 'tenant',
          },
        });
        currentDate = currentDate.add(1, 'day');
        continue;
      }

      const tenantStart = dayjs(currentDate.format('YYYY-MM-DD') + ' ' + tenantHour.start_time);
      const tenantEnd = dayjs(currentDate.format('YYYY-MM-DD') + ' ' + tenantHour.end_time);

      // Bloquear antes do horário do tenant
      if (tenantStart.hour() > 0 || tenantStart.minute() > 0) {
        blockedEvents.push({
          id: `tenant-before-${currentDate.format('YYYY-MM-DD')}`,
          title: 'Fora do horário de funcionamento',
          start: currentDate.startOf('day').toDate(),
          end: tenantStart.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
          classNames: ['fc-event-unavailable'],
          display: 'block',
          extendedProps: {
            isUnavailable: true,
            reason: 'tenant',
          },
        });
      }

      // Bloquear depois do horário do tenant
      const dayEnd = currentDate.endOf('day');
      if (tenantEnd.isBefore(dayEnd)) {
        blockedEvents.push({
          id: `tenant-after-${currentDate.format('YYYY-MM-DD')}`,
          title: 'Fora do horário de funcionamento',
          start: tenantEnd.toDate(),
          end: dayEnd.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
          classNames: ['fc-event-unavailable'],
          display: 'block',
          extendedProps: {
            isUnavailable: true,
            reason: 'tenant',
          },
        });
      }

      // Se houver availabilities, verificar horários do profissional
      if (availabilities.length > 0) {
        const availability = availabilities.find((a) => a.weekday === weekday && a.active);
        
        if (!availability) {
          // Dia inteiro indisponível do profissional (mas dentro do horário do tenant)
          blockedEvents.push({
            id: `provider-unavailable-${currentDate.format('YYYY-MM-DD')}`,
            title: 'Profissional indisponível',
            start: tenantStart.toDate(),
            end: tenantEnd.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'provider',
            },
          });
        } else {
          const availStart = dayjs(currentDate.format('YYYY-MM-DD') + ' ' + availability.start_time);
          const availEnd = dayjs(currentDate.format('YYYY-MM-DD') + ' ' + availability.end_time);

          // Ajustar para não ultrapassar o horário do tenant
          const effectiveStart = availStart.isAfter(tenantStart) ? availStart : tenantStart;
          const effectiveEnd = availEnd.isBefore(tenantEnd) ? availEnd : tenantEnd;

          // Bloquear antes da disponibilidade do profissional (dentro do horário do tenant)
          if (effectiveStart.isAfter(tenantStart)) {
            blockedEvents.push({
              id: `provider-before-${currentDate.format('YYYY-MM-DD')}`,
              title: 'Profissional indisponível',
              start: tenantStart.toDate(),
              end: effectiveStart.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
              classNames: ['fc-event-unavailable'],
              display: 'block',
              extendedProps: {
                isUnavailable: true,
                reason: 'provider',
              },
            });
          }

          // Bloquear depois da disponibilidade do profissional (dentro do horário do tenant)
          if (effectiveEnd.isBefore(tenantEnd)) {
            blockedEvents.push({
              id: `provider-after-${currentDate.format('YYYY-MM-DD')}`,
              title: 'Profissional indisponível',
              start: effectiveEnd.toDate(),
              end: tenantEnd.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
              classNames: ['fc-event-unavailable'],
              display: 'block',
              extendedProps: {
                isUnavailable: true,
                reason: 'provider',
              },
            });
          }
        }
      } else {
        // Sem availabilities, considerar todo o horário do tenant como disponível
        // (mas já bloqueamos fora do tenant acima)
      }

      currentDate = currentDate.add(1, 'day');
    }

    return blockedEvents;
  }, [businessHours, availabilities, currentViewRange]);

  // Converter horários indisponíveis do profissional em eventos (otimizado com useMemo)
  const unavailableEvents = useMemo(() => {
    if (!selectedProvider || !currentViewRange) {
      return [];
    }

    const unavailableEventsList: EventInput[] = [];
    const startDate = dayjs(currentViewRange.start);
    const endDate = dayjs(currentViewRange.end);

    // Para cada dia no período visível
    let currentDate = startDate.startOf('day');
    const finalDate = endDate.endOf('day');

    while (currentDate.isBefore(finalDate) || currentDate.isSame(finalDate, 'day')) {
      const weekday = currentDate.day(); // 0 = domingo, 1 = segunda, etc
      const dateStr = currentDate.format('YYYY-MM-DD');
      
      // Verificar horário do tenant para este dia
      const tenantHour = businessHours.find((bh) => bh.weekday === weekday && bh.active);
      
      if (!tenantHour) {
        // Dia inteiro fora do funcionamento do tenant
        unavailableEventsList.push({
          id: `unavailable-tenant-${dateStr}`,
          title: 'Fora do horário de funcionamento',
          start: currentDate.startOf('day').toDate(),
          end: currentDate.endOf('day').toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
          classNames: ['fc-event-unavailable'],
          display: 'block',
          extendedProps: {
            isUnavailable: true,
            reason: 'tenant',
          },
        });
        currentDate = currentDate.add(1, 'day');
        continue;
      }

      const tenantStart = dayjs(`${dateStr} ${tenantHour.start_time}`);
      const tenantEnd = dayjs(`${dateStr} ${tenantHour.end_time}`);

      // Encontrar availability para este dia da semana
      const availability = filteredAvailabilities.find((a) => a.weekday === weekday);
      
      if (availability) {
        // Profissional tem disponibilidade neste dia
        const availStart = dayjs(`${dateStr} ${availability.start_time}`);
        const availEnd = dayjs(`${dateStr} ${availability.end_time}`);

        // Ajustar para não ultrapassar o horário do tenant
        const effectiveAvailStart = availStart.isAfter(tenantStart) ? availStart : tenantStart;
        const effectiveAvailEnd = availEnd.isBefore(tenantEnd) ? availEnd : tenantEnd;

        // Bloquear antes da disponibilidade do profissional (dentro do horário do tenant)
        if (effectiveAvailStart.isAfter(tenantStart)) {
          unavailableEventsList.push({
            id: `unavailable-before-${selectedProvider}-${weekday}-${dateStr}`,
            title: 'Profissional indisponível',
            start: tenantStart.toDate(),
            end: effectiveAvailStart.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'provider',
            },
          });
        }

        // Bloquear depois da disponibilidade do profissional (dentro do horário do tenant)
        if (effectiveAvailEnd.isBefore(tenantEnd)) {
          unavailableEventsList.push({
            id: `unavailable-after-${selectedProvider}-${weekday}-${dateStr}`,
            title: 'Profissional indisponível',
            start: effectiveAvailEnd.toDate(),
            end: tenantEnd.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'provider',
            },
          });
        }

        // Bloquear antes do horário do tenant (se houver)
        if (tenantStart.hour() > 0 || tenantStart.minute() > 0) {
          unavailableEventsList.push({
            id: `unavailable-tenant-before-${dateStr}`,
            title: 'Fora do horário de funcionamento',
            start: currentDate.startOf('day').toDate(),
            end: tenantStart.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'tenant',
            },
          });
        }

        // Bloquear depois do horário do tenant (se houver)
        const dayEnd = currentDate.endOf('day');
        if (tenantEnd.isBefore(dayEnd)) {
          unavailableEventsList.push({
            id: `unavailable-tenant-after-${dateStr}`,
            title: 'Fora do horário de funcionamento',
            start: tenantEnd.toDate(),
            end: dayEnd.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'tenant',
            },
          });
        }
      } else {
        // Profissional não tem disponibilidade neste dia (mas está dentro do horário do tenant)
        unavailableEventsList.push({
          id: `unavailable-provider-${selectedProvider}-${weekday}-${dateStr}`,
          title: 'Profissional indisponível',
          start: tenantStart.toDate(),
          end: tenantEnd.toDate(),
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
          classNames: ['fc-event-unavailable'],
          display: 'block',
          extendedProps: {
            isUnavailable: true,
            reason: 'provider',
          },
        });

        // Bloquear antes do horário do tenant (se houver)
        if (tenantStart.hour() > 0 || tenantStart.minute() > 0) {
          unavailableEventsList.push({
            id: `unavailable-tenant-before-${dateStr}`,
            title: 'Fora do horário de funcionamento',
            start: currentDate.startOf('day').toDate(),
            end: tenantStart.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'tenant',
            },
          });
        }

        // Bloquear depois do horário do tenant (se houver)
        const dayEnd = currentDate.endOf('day');
        if (tenantEnd.isBefore(dayEnd)) {
          unavailableEventsList.push({
            id: `unavailable-tenant-after-${dateStr}`,
            title: 'Fora do horário de funcionamento',
            start: tenantEnd.toDate(),
            end: dayEnd.toDate(),
            backgroundColor: '#c5221f',
            borderColor: '#b71c1c',
            textColor: '#ffffff',
            classNames: ['fc-event-unavailable'],
            display: 'block',
            extendedProps: {
              isUnavailable: true,
              reason: 'tenant',
            },
          });
        }
      }

      currentDate = currentDate.add(1, 'day');
    }

    return unavailableEventsList;
  }, [filteredAvailabilities, selectedProvider, currentViewRange, businessHours]);

  // Converter blocks em eventos de bloqueio (otimizado com useMemo)
  const blockEvents = useMemo(() => {
    return filteredBlocks.map((block) => {
      const start = dayjs(block.start_at).toDate();
      const end = dayjs(block.end_at).toDate();
      
      return {
        id: `block-${block.id}`,
        title: block.reason || 'Bloqueado',
        start,
        end,
          backgroundColor: '#c5221f',
          borderColor: '#b71c1c',
          textColor: '#ffffff',
        classNames: ['fc-event-block'],
        display: 'block',
        extendedProps: {
          isBlock: true,
          block,
        },
      };
    });
  }, [filteredBlocks]);

  // Combinar todos os eventos: agendamentos + bloqueios (otimizado)
  const appointmentEvents: EventInput[] = useMemo(() => 
    appointments
      .map(formatEventForCalendar)
      .filter((e): e is EventInput => e !== null),
    [appointments, userData, userType, clientLabel]
  );

  // Combinar todos os eventos: indisponibilidades + bloqueios + agendamentos
  const events: EventInput[] = useMemo(() => [
    ...unavailableEvents,
    ...blockEvents,
    ...appointmentEvents,
  ], [unavailableEvents, blockEvents, appointmentEvents]);

  // Calcular dias da semana que devem ser ocultados (dias sem horário de funcionamento)
  const hiddenDays = useMemo(() => {
    if (businessHours.length === 0) return [];
    
    const activeWeekdays = businessHours
      .filter((bh) => bh.active)
      .map((bh) => bh.weekday === 0 ? 0 : bh.weekday); // 0 = domingo
    
    // Dias da semana: 0 = domingo, 1 = segunda, ..., 6 = sábado
    const allWeekdays = [0, 1, 2, 3, 4, 5, 6];
    const inactiveDays = allWeekdays.filter((day) => !activeWeekdays.includes(day));
    
    return inactiveDays;
  }, [businessHours]);

  // Calcular horário mínimo e máximo dos businessHours
  const { minTime, maxTime } = useMemo(() => {
    if (businessHours.length === 0) {
      return { minTime: '06:00:00', maxTime: '22:00:00' };
    }

    const activeHours = businessHours.filter((bh) => bh.active);
    if (activeHours.length === 0) {
      return { minTime: '06:00:00', maxTime: '22:00:00' };
    }

    // Encontrar o horário mais cedo e mais tarde
    let minHour = 23;
    let minMinute = 59;
    let maxHour = 0;
    let maxMinute = 0;

    activeHours.forEach((bh) => {
      const [startHour, startMinute] = bh.start_time.split(':').map(Number);
      const [endHour, endMinute] = bh.end_time.split(':').map(Number);

      if (startHour < minHour || (startHour === minHour && startMinute < minMinute)) {
        minHour = startHour;
        minMinute = startMinute;
      }

      if (endHour > maxHour || (endHour === maxHour && endMinute > maxMinute)) {
        maxHour = endHour;
        maxMinute = endMinute;
      }
    });

    const minTimeStr = `${minHour.toString().padStart(2, '0')}:${minMinute.toString().padStart(2, '0')}:00`;
    const maxTimeStr = `${maxHour.toString().padStart(2, '0')}:${maxMinute.toString().padStart(2, '0')}:00`;

    return { minTime: minTimeStr, maxTime: maxTimeStr };
  }, [businessHours]);

  // Handlers
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!canCreate) {
      message.warning('Você não tem permissão para criar agendamentos');
      selectInfo.view.calendar.unselect();
      return;
    }

    const startTime = dayjs(selectInfo.start);
    const endTime = dayjs(selectInfo.end);

    // Verificar se está em horário indisponível (tenant ou profissional)
    const isUnavailable = !isTimeSlotAvailable(startTime) || !isTimeSlotAvailable(endTime);
    if (isUnavailable) {
      message.warning('Este horário está indisponível');
      selectInfo.view.calendar.unselect();
      return;
    }

    // Verificar se está em algum block
    const isBlocked = filteredBlocks.some((block) => {
      const blockStart = dayjs(block.start_at);
      const blockEnd = dayjs(block.end_at);
      return (
        (startTime.isSameOrAfter(blockStart) && startTime.isBefore(blockEnd)) ||
        (endTime.isAfter(blockStart) && endTime.isSameOrBefore(blockEnd)) ||
        (startTime.isBefore(blockStart) && endTime.isAfter(blockEnd))
      );
    });

    if (isBlocked) {
      message.warning('Este horário está bloqueado');
      selectInfo.view.calendar.unselect();
      return;
    }

    // Cliente não pode criar agendamentos em horários ocupados
    if (userType === 'client') {
      const hasConflict = appointments.some((apt) => {
        const aptStart = dayjs(apt.date_start);
        const aptEnd = dayjs(apt.date_end);
        
        return (
          (startTime.isSameOrAfter(aptStart) && startTime.isBefore(aptEnd)) ||
          (endTime.isAfter(aptStart) && endTime.isSameOrBefore(aptEnd)) ||
          (startTime.isBefore(aptStart) && endTime.isAfter(aptEnd))
        );
      });

      if (hasConflict) {
        message.warning('Este horário já está ocupado');
        selectInfo.view.calendar.unselect();
        return;
      }
    }

    setSelectedDate(selectInfo.startStr);
    setEditingAppointment(null);
    setModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const extendedProps = clickInfo.event.extendedProps;
    
    // Não permite clicar em horários indisponíveis ou bloqueios
    if (extendedProps.isUnavailable || extendedProps.isBlock) {
      message.info('Este horário está indisponível');
      return;
    }

    const appointment = extendedProps.appointment as Appointment & { isBlocked?: boolean };
    
    // Não permite editar horários bloqueados para clientes
    if (appointment?.isBlocked && userType === 'client') {
      message.info('Este horário está ocupado');
      return;
    }

    if (appointment && canEdit) {
      setEditingAppointment(appointment);
      setSelectedDate(null);
      setModalOpen(true);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    if (!canEdit) {
      message.warning('Você não tem permissão para editar agendamentos');
      dropInfo.revert();
      return;
    }

    const appointment = dropInfo.event.extendedProps.appointment as Appointment;
    if (!appointment.id) {
      dropInfo.revert();
      return;
    }

    try {
      // Formatar data para enviar ao backend
      const newStart = dayjs(dropInfo.event.start).format('YYYY-MM-DD HH:mm:ss');
      await appointmentService.update(appointment.id, {
        date_start: newStart,
      });
      message.success('Agendamento atualizado com sucesso!');
      fetchAppointments();
    } catch (error: any) {
      message.error('Erro ao atualizar agendamento: ' + (error.response?.data?.message || error.message));
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    if (!canEdit) {
      message.warning('Você não tem permissão para editar agendamentos');
      resizeInfo.revert();
      return;
    }

    const appointment = resizeInfo.event.extendedProps.appointment as Appointment;
    if (!appointment.id) {
      resizeInfo.revert();
      return;
    }

    try {
      const newStart = dayjs(resizeInfo.event.start).format('YYYY-MM-DD HH:mm:ss');
      const newEnd = dayjs(resizeInfo.event.end).format('YYYY-MM-DD HH:mm:ss');
      
      await appointmentService.update(appointment.id, {
        date_start: newStart,
        date_end: newEnd,
      });
      message.success('Agendamento atualizado com sucesso!');
      fetchAppointments();
    } catch (error: any) {
      message.error('Erro ao atualizar agendamento: ' + (error.response?.data?.message || error.message));
      resizeInfo.revert();
    }
  };

  const handleDatesSet = (arg: { start: Date; end: Date; view: any }) => {
    // Armazenar o período atual para recalcular horários indisponíveis
    const newRange = { start: arg.start, end: arg.end };
    
    // Verificar se o período realmente mudou antes de atualizar
    if (currentViewRange && 
        currentViewRange.start.getTime() === newRange.start.getTime() &&
        currentViewRange.end.getTime() === newRange.end.getTime()) {
      return; // Período não mudou, não fazer nada
    }
    
    setCurrentViewRange(newRange);
    // Buscar agendamentos para o período visível
    fetchAppointments(arg.start, arg.end);
  };

  const handleAdd = () => {
    if (!canCreate) {
      message.warning('Você não tem permissão para criar agendamentos');
      return;
    }
    setSelectedDate(null);
    setEditingAppointment(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingAppointment(null);
    setSelectedDate(null);
  };

  const handleSuccess = () => {
    fetchAppointments();
  };

  return (
    <div className="calendario-container">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={4} style={{ margin: 0 }}>
          {userType === 'admin' && 'Agenda Completa'}
          {userType === 'provider' && 'Minha Agenda'}
          {userType === 'client' && 'Meus Agendamentos'}
        </Title>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              const calendarApi = calendarRef.current?.getApi();
              if (calendarApi) {
                const view = calendarApi.view;
                fetchAppointments(view.activeStart, view.activeEnd);
              } else {
                fetchAppointments();
              }
            }} 
            loading={loading}
          >
            Atualizar
          </Button>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Novo Agendamento
            </Button>
          )}
        </Space>
      </Space>

      <Space style={{ width: '100%', marginBottom: 16 }} wrap>
        <Select
          placeholder="Filtrar por profissional"
          allowClear
          style={{ width: 250 }}
          value={selectedProvider}
          onChange={(value) => setSelectedProvider(value)}
          showSearch
          optionFilterProp="label"
          options={providers.map((provider) => ({
            value: provider.id,
            label: provider.user?.name || `Profissional ${provider.id}`,
          }))}
        />
      </Space>

      <Spin spinning={loading}>
        <div className="calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale={ptBrLocale}
            height="auto"
            events={events}
            editable={canEdit}
            selectable={canCreate}
            selectMirror={true}
            dayMaxEvents={true}
            moreLinkClick="popover"
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            slotMinTime={minTime}
            slotMaxTime={maxTime}
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            scrollTime={businessHours.length > 0 
              ? businessHours
                  .filter((bh) => bh.active)
                  .map((bh) => bh.start_time.substring(0, 5))[0] || '08:00'
              : '08:00'
            }
            hiddenDays={hiddenDays.length > 0 ? hiddenDays : undefined}
            businessHours={businessHours.length > 0 
              ? businessHours
                .filter((bh) => bh.active)
                .map((bh) => ({
                  daysOfWeek: [bh.weekday === 0 ? 0 : bh.weekday], // 0 = domingo
                  startTime: bh.start_time.substring(0, 5), // "06:00:00" -> "06:00"
                  endTime: bh.end_time.substring(0, 5),
                }))
              : [
                  {
                    daysOfWeek: [1, 2, 3, 4, 5, 6],
                    startTime: '08:00',
                    endTime: '18:00',
                  }
                ]
            }
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
          />
        </div>
      </Spin>

      {canCreate && (
        <AddAppointment
          open={modalOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          appointment={editingAppointment}
          selectedDate={selectedDate}
          userType={userType}
          userData={userData}
        />
      )}
    </div>
  );
};
