import { Tabs } from 'antd';
import { useAuth } from '../../shared/contexts/AuthContext';
import { HorarioFuncionamento } from './components/HorarioFuncionamento';
import { DisponibilidadesProfissional } from './components/DisponibilidadesProfissional';
import { BloqueiosProfissional } from './components/BloqueiosProfissional';

export const SettingsConfig = () => {
  const { isTenant, user } = useAuth();

  // Verificar se é admin tenant ou profissional
  const isAdmin = isTenant();
  const isProfessional = user?.role?.toLowerCase() === 'tenant profissional';

  if (!isAdmin && !isProfessional) {
    return (
      <div>
        <h1>Configurações</h1>
        <p>Você não tem permissão para acessar esta página. Apenas administradores de tenant e profissionais podem acessar as configurações.</p>
      </div>
    );
  }

  const items = [];

  // Horário de Funcionamento - apenas para admin
  if (isAdmin) {
    items.push({
      key: '1',
      label: 'Horário de Funcionamento',
      children: <HorarioFuncionamento />,
    });
  }

  // Disponibilidades e Bloqueios - para admin e profissional
  items.push(
    {
      key: '2',
      label: 'Disponibilidades',
      children: <DisponibilidadesProfissional />,
    },
    {
      key: '3',
      label: 'Bloqueios',
      children: <BloqueiosProfissional />,
    }
  );

  return (
    <div>
      <h1>Configurações</h1>
      <Tabs defaultActiveKey={isAdmin ? '1' : '2'} items={items} />
    </div>
  );
};