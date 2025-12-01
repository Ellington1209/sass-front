import { CrudService } from './crud.service';
import { api } from './api.service';

export interface StudentUser {
  id: number;
  name: string;
  email: string;
}

export interface StudentAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface StudentStatus {
  id: number;
  key: string;
  name: string;
  description?: string;
}

export interface Student {
  id?: number;
  tenant_id?: number;
  user_id?: number;
  user?: StudentUser;
  cpf: string;
  rg?: string;
  birth_date: string;
  phone?: string;
  address?: StudentAddress;
  address_street?: string; // Para formulário
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  category?: string;
  status?: StudentStatus;
  status_students_id?: number;
  photo_url?: string;
  documents?: any[];
  notes?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface StudentListParams {
  page?: number;
  per_page?: number;
  status?: number | string;
  category?: string;
  search?: string;
}

export interface StudentListResponse {
  data: Student[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Service específico para Student
 * Usa o CrudService genérico internamente
 */
class StudentService extends CrudService<Student> {
  constructor() {
    super('/students');
  }

  /**
   * Listar estudantes com paginação e filtros
   */
  async listPaginated(params?: StudentListParams): Promise<StudentListResponse> {
    const response = await api.get<StudentListResponse>('/students', { params });
    return response.data;
  }

  /**
   * Criar estudante com upload de foto
   */
  async createWithPhoto(data: FormData): Promise<Student> {
    const response = await api.post<Student>('/students', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Atualizar estudante com upload de foto
   */
  async updateWithPhoto(id: number | string, data: FormData): Promise<Student> {
    const response = await api.put(`/students/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const studentService = new StudentService();

