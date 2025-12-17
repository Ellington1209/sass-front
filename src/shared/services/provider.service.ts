import { CrudService } from './crud.service';
import { api } from './api.service';

export interface ProviderUser {
  id: number;
  name: string;
  email: string;
}

export interface ProviderAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ProviderPerson {
  id: number;
  cpf: string;
  rg?: string | null;
  birth_date: string;
  phone?: string;
  address?: ProviderAddress;
}

export interface ProviderServiceItem {
  id: number;
  name: string;
  slug: string;
}

export interface Provider {
  id?: number;
  tenant_id?: number;
  person_id?: number;
  user_id?: number;
  user?: ProviderUser;
  person?: ProviderPerson;
  cpf?: string;
  rg?: string | null;
  birth_date?: string;
  phone?: string;
  address?: ProviderAddress;
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  service_ids?: (number | string)[];
  services?: ProviderServiceItem[];
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service específico para Provider
 * Usa o CrudService genérico internamente
 */
class ProviderService extends CrudService<Provider> {
  constructor() {
    super('/agenda/providers');
  }

  /**
   * Criar provider com upload de foto
   */
  async createWithPhoto(data: FormData): Promise<Provider> {
    const response = await api.post<Provider>('/agenda/providers', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Atualizar provider com upload de foto
   */
  async updateWithPhoto(id: number | string, data: FormData): Promise<Provider> {
    const response = await api.put(`/agenda/providers/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const providerService = new ProviderService();

