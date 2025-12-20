import { CrudService } from './crud.service';
import { api } from './api.service';

export interface WhatsAppInstance {
  id: number;
  evolution_id: string;
  tenant_id: number;
  name: string;
  status: 'connected' | 'disconnected';
  owner_jid?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInstanceRequest {
  instanceName: string;
  number?: string;
}

export interface CreateInstanceResponse {
  instance: WhatsAppInstance;
  qrcode: string | null;
}

export interface SendMessageRequest {
  number: string;
  text: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: any;
}

/**
 * Service específico para WhatsApp
 */
class WhatsAppService {
  private baseRoute = '/whatsapp/instances';

  /**
   * Listar todas as instâncias
   */
  async list(): Promise<WhatsAppInstance[]> {
    const response = await api.get<{ success: boolean; data: WhatsAppInstance[] }>(this.baseRoute);
    return response.data.data || [];
  }

  /**
   * Buscar uma instância por ID
   */
  async getById(id: number | string): Promise<WhatsAppInstance> {
    const response = await api.get<{ success: boolean; data: WhatsAppInstance }>(`${this.baseRoute}/${id}`);
    return response.data.data;
  }

  /**
   * Criar uma nova instância
   */
  async create(data: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    const response = await api.post<{ success: boolean; data: CreateInstanceResponse }>(this.baseRoute, data);
    return response.data.data;
  }

  /**
   * Enviar mensagem via instância
   */
  async sendMessage(instanceId: number | string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await api.post<{ success: boolean; data: any }>(
      `${this.baseRoute}/${instanceId}/send`,
      data
    );
    return {
      success: response.data.success,
      data: response.data.data,
    };
  }

  /**
   * Deletar uma instância
   */
  async delete(id: number | string): Promise<void> {
    await api.delete(`${this.baseRoute}/${id}`);
  }
}

export const whatsappService = new WhatsAppService();

