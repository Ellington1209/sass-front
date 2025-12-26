import { Tabs } from 'antd';
import { usePermissions } from '../../shared/contexts/PermissionsContext';
import { useAuth } from '../../shared/contexts/AuthContext';
import { useMemo } from 'react';
import { Servicos } from './Servicos';
import { Profissionais } from './Profissionais';
import { Calendario } from './Calendario';

export const Agenda = () => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  const items = useMemo(() => {
    const allItems = [
      {
        key: '1',
        label: 'Serviços',
        children: <Servicos />,
        permission: 'agenda.services.view',
      },
      {
        key: '2',
        label: 'Profissionais',
        children: <Profissionais />,
        permission: 'agenda.providers.view',
      },
      {
        key: '3',
        label: 'Agendamentos',
        children: <Calendario />,
        permission: null, // Qualquer um pode ver
      },
    ];

    // Verifica se o role é "tenant cliente"
    const isTenantCliente = user?.role?.toLowerCase() === 'tenant cliente';

    // Filtra os items baseado nas permissões e role
    return allItems
      .filter((item) => {
        // Se for "tenant cliente", não mostra itens com permissão específica
        if (isTenantCliente && item.permission) {
          return false;
        }
        // Verifica permissão se necessário
        return !item.permission || hasPermission(item.permission);
      })
      .map(({ permission, ...item }) => item);
  }, [hasPermission, user]);

  // Define a primeira tab disponível como padrão
  const defaultActiveKey = items.length > 0 ? items[0].key : '1';

  return (
    <div>
      <Tabs defaultActiveKey={defaultActiveKey} items={items} />
    </div>
  );
};