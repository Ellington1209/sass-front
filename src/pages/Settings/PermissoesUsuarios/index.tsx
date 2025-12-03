import { Tabs } from 'antd';
import { Usuarios } from './Usuarios';
import { Permissoes } from './Permissoes';

export const PermissoesUsuarios = () => {
  const items = [
    {
      key: '1',
      label: 'Usuário do sistema',
      children: <Usuarios />,
    },
    {
      key: '2',
      label: 'Permissões',
      children: <Permissoes />,
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};