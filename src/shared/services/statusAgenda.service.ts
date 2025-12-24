import { CrudService } from './crud.service';

export interface StatusAgenda {
  id: number;
  key: string;
  name: string;
  description?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service para gerenciar status de agenda
 * Usa o CrudService genérico internamente
 */
class StatusAgendaService extends CrudService<StatusAgenda> {
  constructor() {
    super('/status-agenda');
  }
}

export const statusAgendaService = new StatusAgendaService();

