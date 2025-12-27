import { useState } from 'react';
import { Typography, Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../shared/contexts/AuthContext';
import { CommissionConfigTable, EditCommissionModal } from './components';
import type { Provider } from '../../shared/services/provider.service';
import type { CommissionConfig } from '../../shared/services/commission.service';

const { Title } = Typography;

export const Comissoes = () => {
  const { isTenant, hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<CommissionConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar se o usuário tem permissão para acessar esta página
  const canAccess = isTenant() && hasPermission('financeiro.commissions.view');
  const canCreate = hasPermission('financeiro.commissions.edit') || hasPermission('financeiro.commissions.view');

  if (!canAccess) {
    return (
      <div>
        <Title level={2}>Comissões</Title>
        <p>Você não tem permissão para acessar esta página. Apenas administradores de tenant podem configurar comissões.</p>
      </div>
    );
  }

  const handleEdit = (config: CommissionConfig | null, provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedConfig(config);
    setModalOpen(true);
  };

  const handleAdd = (provider?: Provider) => {
    setSelectedProvider(provider || null);
    setSelectedConfig(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedProvider(null);
    setSelectedConfig(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Configuração de Comissões</Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAdd()}
            size="large"
          >
            Adicionar Comissão
          </Button>
        )}
      </Space>

      <CommissionConfigTable
        key={refreshKey}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      <EditCommissionModal
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        provider={selectedProvider}
        config={selectedConfig}
      />
    </div>
  );
};