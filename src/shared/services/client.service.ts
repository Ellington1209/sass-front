import { api } from './api.service';

export interface ClientUser {
  id: number;
  name: string;
  email: string;
}

export interface ClientPerson {
  id: number;
  cpf: string;
  rg?: string | null;
  birth_date: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string | null;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface ClientStatus {
  id: number;
  key: string;
  name: string;
  description?: string;
}

export interface Client {
  id: number;
  tenant_id: number;
  person_id: number;
  user?: ClientUser;
  person?: ClientPerson;
  category?: string;
  registration_number?: string | null;
  status?: ClientStatus;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientListResponse {
  data: Client[];
  total: number;
}

/**
 * Service para gerenciar clientes/alunos
 */
class ClientService {
  private baseRoute = '/clients';

  /**
   * Listar todos os clientes/alunos
   */
  async list(): Promise<Client[]> {
    const response = await api.get<ClientListResponse>(this.baseRoute);
    // A resposta vem no formato { data: [...], total: ... }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback: se vier direto como array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  /**
   * Buscar um cliente por ID
   */
  async getById(id: number | string): Promise<Client> {
    const response = await api.get<Client>(`${this.baseRoute}/${id}`);
    return response.data;
  }
}

export const clientService = new ClientService();

