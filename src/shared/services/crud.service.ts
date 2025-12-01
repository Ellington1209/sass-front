import { api } from './api.service';

/**
 * Service genérico para operações CRUD
 * Recebe a rota base como parâmetro
 */
export class CrudService<T = any> {
  private baseRoute: string;

  constructor(baseRoute: string) {
    this.baseRoute = baseRoute;
  }

  /**
   * Listar todos os registros
   */
  async list(params?: Record<string, any>): Promise<T[]> {
    const response = await api.get<any>(this.baseRoute, { params });
    // Se a resposta vier no formato { data: [] }, extrair o array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    // Se vier no formato { data: { data: [] } } ou similar
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Fallback: retornar array vazio se não encontrar dados
    return [];
  }

  /**
   * Buscar um registro por ID
   */
  async getById(id: number | string): Promise<T> {
    const response = await api.get<any>(`${this.baseRoute}/${id}`);
    // Se a resposta vier no formato { data: {...} }, extrair o objeto
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Criar um novo registro
   */
  async create(data: Partial<T>): Promise<T> {
    const response = await api.post<any>(this.baseRoute, data);
    // Se a resposta vier no formato { data: {...} }, extrair o objeto
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Atualizar um registro
   */
  async update(id: number | string, data: Partial<T>): Promise<T> {
    const response = await api.put<any>(`${this.baseRoute}/${id}`, data);
    // Se a resposta vier no formato { data: {...} }, extrair o objeto
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Deletar um registro
   */
  async delete(id: number | string): Promise<void> {
    await api.delete(`${this.baseRoute}/${id}`);
  }

  /**
   * Deletar múltiplos registros
   */
  async deleteMany(ids: (number | string)[]): Promise<void> {
    await api.delete(`${this.baseRoute}/batch`, { data: { ids } });
  }
}

