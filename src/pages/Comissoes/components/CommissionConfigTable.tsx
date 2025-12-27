import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Input, message, Tag, Typography, Popconfirm } from 'antd';
import { EditOutlined, SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { providerService, type Provider } from '../../../shared/services/provider.service';
import { commissionService, type CommissionConfig } from '../../../shared/services/commission.service';
import { useAuth } from '../../../shared/contexts/AuthContext';

const { Text } = Typography;

interface CommissionConfigTableProps {
  onEdit: (config: CommissionConfig | null, provider: Provider) => void;
  onAdd: (provider: Provider) => void;
}

export const CommissionConfigTable: React.FC<CommissionConfigTableProps> = ({ onEdit, onAdd }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);
  
  const canEdit = hasPermission('financeiro.commissions.edit') || hasPermission('financeiro.commissions.view');
  const canDelete = hasPermission('financeiro.commissions.delete');

  const fetchData = async (searchTerm?: string) => {
    try {
      setLoading(true);
      
      // Buscar configurações (a API já retorna provider e service)
      // Enviar termo de busca para o backend como parâmetro de query
      const params: any = {};
      
      // Enviar o que foi digitado (nome ou email) como parâmetro de busca
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const configsData = await commissionService.listConfigs(params).catch(() => []);
      
      // Buscar providers apenas na primeira carga (quando não há busca)
      // Quando há busca, os providers vêm junto com as configurações
      if (!searchTerm || !searchTerm.trim()) {
        const providersData = await providerService.list().catch(() => []);
        setProviders(providersData);
      }

      setConfigs(configsData);
    } catch (error: any) {
      message.error('Erro ao carregar dados: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Disparar busca no backend quando o usuário parar de digitar (debounce)
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchData(value);
    }, 500); // Aguardar 500ms após parar de digitar
  };
  
  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await commissionService.deleteConfig(id);
      message.success('Configuração excluída com sucesso!');
      fetchData();
    } catch (error: any) {
      message.error('Erro ao excluir configuração: ' + (error.response?.data?.message || error.message));
    }
  };

  const getSpecificityLevel = (config: CommissionConfig): { level: number; label: string; color: string } => {
    if (config.service_id) {
      return { level: 1, label: 'Serviço', color: 'blue' };
    }
    return { level: 2, label: 'Padrão', color: 'default' };
  };

  // Criar um mapa de providers apenas das configurações retornadas
  const providersMap = new Map<number, Provider>();
  
  // Processar todas as configurações e criar providers a partir delas
  configs.forEach(config => {
    // Obter provider_id (pode vir direto ou via provider.id)
    const providerId = config.provider_id || config.provider?.id;
    
    if (providerId && !providersMap.has(providerId)) {
      // Buscar provider completo na lista primeiro (se disponível)
      const fullProvider = providers.find(p => p.id === providerId);
      
      if (fullProvider) {
        providersMap.set(providerId, fullProvider);
      } else if (config.provider?.name) {
        // Se não encontrou, criar provider básico a partir da config
        providersMap.set(providerId, {
          id: providerId,
          user: {
            id: config.provider.id || providerId,
            name: config.provider.name,
            email: '',
          },
        } as Provider);
      }
    }
  });
  
  // Adicionar providers que não têm configuração APENAS se não houver busca ativa
  // Quando há busca, mostrar apenas os resultados retornados pela API
  if (!searchValue || !searchValue.trim()) {
    providers.forEach(provider => {
      if (provider.id && !providersMap.has(provider.id)) {
        providersMap.set(provider.id, provider);
      }
    });
  }

  // Agrupar configurações por provider
  const configsByProvider = Array.from(providersMap.values()).map(provider => {
    // Filtrar configurações que pertencem a este provider
    const providerConfigs = configs.filter(c => {
      // Comparar provider_id da config (pode vir direto ou via provider.id) com id do provider
      const configProviderId = c.provider_id || c.provider?.id;
      const matches = configProviderId === provider.id;
      return matches;
    });
    
    return {
      provider,
      configs: providerConfigs.length > 0 ? providerConfigs : null,
    };
  });

  // Filtrar por busca
  // Os dados já vêm filtrados do backend quando há busca
  // Não precisamos filtrar localmente
  const filteredData = configsByProvider;

  // Expandir para uma linha por configuração
  interface TableRow {
    key: string;
    provider: Provider;
    config: CommissionConfig | null;
    isProviderRow: boolean;
  }

  const tableData: TableRow[] = filteredData.flatMap(({ provider, configs }): TableRow[] => {
    if (!configs || configs.length === 0) {
      // Se não tem configuração, mostrar apenas o provider
      return [{
        key: `provider-${provider.id}`,
        provider,
        config: null,
        isProviderRow: true,
      }];
    }
    // Retornar uma linha por configuração
    return configs.map(config => ({
      key: `config-${config.id}`,
      provider,
      config,
      isProviderRow: false,
    }));
  });

  const columns: AppTableColumn<any>[] = [
    {
      title: 'Profissional',
      key: 'provider',
      width: 200,
      render: (_: any, record: any) => {
        const providerName = record.provider.user?.name || record.config?.provider?.name || '-';
        const providerEmail = record.provider.user?.email || '-';
        
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{providerName}</Text>
            {providerEmail !== '-' && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {providerEmail}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Especificidade',
      key: 'specificity',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isProviderRow && !record.config) {
          return <Tag color="default">Sem configuração</Tag>;
        }
        const specificity = getSpecificityLevel(record.config);
        return <Tag color={specificity.color}>{specificity.label}</Tag>;
      },
    },
    {
      title: 'Serviço',
      key: 'service',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isProviderRow && !record.config) {
          return <Text type="secondary">-</Text>;
        }
        const serviceName = record.config?.service?.name;
        return serviceName ? (
          <Text strong>{serviceName}</Text>
        ) : (
          <Text type="secondary" italic>Todos os serviços</Text>
        );
      },
    },
    {
      title: 'Taxa de Comissão',
      key: 'commission_rate',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isProviderRow && !record.config) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Text strong style={{ fontSize: '16px' }}>
            {record.config.commission_rate}%
          </Text>
        );
      },
    },
    {
      title: 'Status',
      key: 'active',
      width: 100,
      render: (_: any, record: any) => {
        if (record.isProviderRow && !record.config) {
          return null;
        }
        return record.config.active !== false ? (
          <Tag color="green">Ativa</Tag>
        ) : (
          <Tag color="red">Inativa</Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: any) => {
        if (record.isProviderRow && !record.config) {
          // Linha sem configuração - mostrar botão para adicionar
          return (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => onAdd(record.provider)}
            >
              Adicionar
            </Button>
          );
        }

        return (
          <Space>
            {canEdit && (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record.config, record.provider)}
                title="Editar"
              />
            )}
            {canDelete && (
              <Popconfirm
                title="Excluir configuração?"
                description="Tem certeza que deseja excluir esta configuração?"
                onConfirm={() => handleDelete(record.config.id!)}
                okText="Sim"
                cancelText="Não"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  title="Excluir"
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Buscar por nome ou email do profissional"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        </Space>
      </Space>

      <AppTable
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} configuração(ões)`,
        }}
      />
    </div>
  );
};
