import { CrudService } from './crud.service';
import { api } from './api.service';

export interface AppointmentService {
  id: number;
  name: string;
  slug: string;
  duration_minutes: number;
}

export interface AppointmentProviderUser {
  id: number;
  name: string;
  email: string;
}

export interface AppointmentProviderPerson {
  id: number;
  cpf: string;
  rg?: string | null;
  birth_date: string;
  phone?: string;
}

export interface AppointmentProvider {
  id: number;
  person_id: number;
  user?: AppointmentProviderUser;
  person?: AppointmentProviderPerson;
  service_ids: number[];
}

export interface AppointmentClient {
  id: number;
  name: string;
  email: string;
}

export interface AppointmentStatus {
  id: number;
  key: string;
  name: string;
}

export interface Appointment {
  id?: number;
  tenant_id?: number;
  service_id: number;
  provider_id: number;
  client_id: number;
  date_start: string;
  date_end?: string;
  status_agenda_id?: number | null;
  notes?: string | null;
  service?: AppointmentService;
  provider?: AppointmentProvider;
  client?: AppointmentClient;
  status_agenda?: AppointmentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentCreatePayload {
  service_id: number;
  provider_id: number;
  client_id: number;
  date_start: string;
  status_agenda_id?: number | null;
  notes?: string | null;
}

export interface AppointmentUpdatePayload {
  service_id?: number;
  provider_id?: number;
  client_id?: number;
  date_start?: string;
  status_agenda_id?: number | null;
  notes?: string | null;
}

export interface AppointmentListParams {
  provider_id?: number;
  date_start?: string;
  date_end?: string;
}

export interface TenantBusinessHour {
  id: number;
  tenant_id: number;
  weekday: number; // 0 = domingo, 1 = segunda, etc
  start_time: string;
  end_time: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderAvailability {
  id: number;
  provider_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface ProviderBlock {
  id: number;
  provider_id: number;
  tenant_id: number;
  start_at: string;
  end_at: string;
  reason?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  tenant_business_hours?: TenantBusinessHour[];
  availabilities?: ProviderAvailability[];
  blocks?: ProviderBlock[];
}

/**
 * Service específico para Appointments
 * Usa o CrudService genérico internamente
 */
class AppointmentService extends CrudService<Appointment> {
  constructor() {
    super('/agenda/appointments');
  }

  /**
   * Listar agendamentos com filtros opcionais
   * Retorna a nova estrutura com appointments, business_hours, availabilities e blocks
   */
  async list(params?: AppointmentListParams): Promise<AppointmentListResponse> {
    const response = await api.get<any>(this.baseRoute, { params });
    
    // Nova estrutura: { appointments: [], tenant_business_hours: [], ... }
    if (response.data?.appointments && Array.isArray(response.data.appointments)) {
      return {
        appointments: response.data.appointments,
        tenant_business_hours: response.data.tenant_business_hours || [],
        availabilities: response.data.availabilities || [],
        blocks: response.data.blocks || [],
      };
    }
    
    // Estrutura antiga (fallback): array direto
    if (response.data && Array.isArray(response.data)) {
      return {
        appointments: response.data,
        tenant_business_hours: [],
        availabilities: [],
        blocks: [],
      };
    }
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return {
        appointments: response.data.data,
        tenant_business_hours: [],
        availabilities: [],
        blocks: [],
      };
    }
    
    return {
      appointments: [],
      tenant_business_hours: [],
      availabilities: [],
      blocks: [],
    };
  }

  /**
   * Deletar múltiplos agendamentos
   */
  async deleteMany(ids: (number | string)[]): Promise<void> {
    await api.delete(`${this.baseRoute}/batch`, { data: { ids } });
  }
}

export const appointmentService = new AppointmentService();

