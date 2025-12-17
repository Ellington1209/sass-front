import { CrudService } from './crud.service';

export interface Module {
  id: number;
  key: string;
  name: string;
}

export interface Price {
  id: number;
  price: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
}

export interface Service {
  id?: number;
  tenant_id?: number;
  module_id: number;
  name: string;
  slug: string;
  duration_minutes: number;
  active?: boolean;
  module?: Module;
  price?: Price | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateServiceRequest {
  module_id: number;
  name: string;
  slug: string;
  duration_minutes: number;
  active?: boolean;
  price?: number;
  currency?: string;
  price_active?: boolean;
  price_start_date?: string | null;
  price_end_date?: string | null;
}

export interface UpdateServiceRequest {
  module_id?: number;
  name?: string;
  slug?: string;
  duration_minutes?: number;
  active?: boolean;
  price?: number;
  currency?: string;
  price_active?: boolean;
  price_start_date?: string | null;
  price_end_date?: string | null;
  update_price?: boolean;
}

/**
 * Service para gerenciar serviços da agenda
 * Usa o CrudService genérico internamente
 */
class ServiceService extends CrudService<Service> {
  constructor() {
    super('/agenda/services');
  }
}

export const serviceService = new ServiceService();

