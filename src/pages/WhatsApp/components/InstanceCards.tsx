import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, message, Popconfirm, Space, Typography, Empty } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { whatsappService, type WhatsAppInstance } from '../../../shared/services/whatsapp.service';
import { useAuth } from '../../../shared/contexts/AuthContext';

const { Text } = Typography;

interface InstanceCardsProps {
  onRefresh: () => void;
}

export const InstanceCards: React.FC<InstanceCardsProps> = ({ onRefresh }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);

  const canDelete = hasPermission('whatsapp.instances.manage') || hasPermission('whatsapp.instances.delete');

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const data = await whatsappService.list();
      setInstances(data);
    } catch (error: any) {
      message.error('Erro ao carregar instâncias: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const handleDelete = async (instance: WhatsAppInstance) => {
    try {
      // Usar o nome da instância (evolution_id ou name) ao invés do ID
      const instanceName = instance.evolution_id || instance.name;
      await whatsappService.delete(instanceName);
      message.success('Instância excluída com sucesso!');
      fetchInstances();
      onRefresh();
    } catch (error: any) {
      message.error('Erro ao excluir instância: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatOwnerJid = (ownerJid?: string) => {
    if (!ownerJid) return null;
    // Formato: 556291487677@s.whatsapp.net
    // Extrair apenas o número antes do @
    const number = ownerJid.split('@')[0];
    // Formatar como telefone brasileiro se tiver 13 dígitos (55 + DDD + número)
    if (number.length === 13 && number.startsWith('55')) {
      const ddd = number.substring(2, 4);
      const phoneNumber = number.substring(4);
      return `(${ddd}) ${phoneNumber.substring(0, phoneNumber.length - 4)}-${phoneNumber.substring(phoneNumber.length - 4)}`;
    }
    return number;
  };

  const getStatusTag = (status: string) => {
    if (status === 'connected') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Conectado
        </Tag>
      );
    }
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        Desconectado
      </Tag>
    );
  };

  const getCardStyle = (status: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { height: '100%', position: 'relative' };
    if (status === 'connected') {
      return {
        ...baseStyle,
        backgroundColor: '#f6ffed', // Verde claro
        borderColor: '#b7eb8f',
      };
    }
    return {
      ...baseStyle,
      backgroundColor: '#fff1f0', // Vermelho claro
      borderColor: '#ffccc7',
    };
  };

  if (instances.length === 0 && !loading) {
    return (
      <Empty
        description="Nenhuma instância cadastrada"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {instances.map((instance) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={instance.id}>
          <Card
            loading={loading}
            hoverable
            style={getCardStyle(instance.status)}
          >
            {canDelete && (
              <Popconfirm
                title="Excluir instância"
                description="Tem certeza que deseja excluir esta instância?"
                onConfirm={() => handleDelete(instance)}
                okText="Sim"
                cancelText="Não"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                />
              </Popconfirm>
            )}
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 16 }}>
                {instance.name}
              </Text>
              
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {instance.evolution_id}
              </Text>
              
              {instance.owner_jid && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Número: {formatOwnerJid(instance.owner_jid)}
                </Text>
              )}
              
              <div>
                {getStatusTag(instance.status)}
              </div>
              
              {instance.created_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Criado em: {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

