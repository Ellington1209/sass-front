import { Tabs } from 'antd';
import { usePermissions } from '../../shared/contexts/PermissionsContext';
import { useMemo } from 'react';
import { Servicos } from './Servicos';
import { Profissionais } from './Profissionais';

export const Agenda = () => {
  const { hasPermission } = usePermissions();

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
        permission: 'provider.view',
      },
      {
        key: '3',
        label: 'Agendamentos',
        children: <div>Agendamentos</div>,
        permission: null, // Qualquer um pode ver
      },
    ];

    // Filtra os items baseado nas permissões
    return allItems
      .filter((item) => !item.permission || hasPermission(item.permission))
      .map(({ permission, ...item }) => item);
  }, [hasPermission]);

  // Define a primeira tab disponível como padrão
  const defaultActiveKey = items.length > 0 ? items[0].key : '1';

  return (
    <div>
      <Tabs defaultActiveKey={defaultActiveKey} items={items} />
    </div>
  );
};