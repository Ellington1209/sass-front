import React from 'react';
import { Modal, Descriptions, Tag, Typography, Button } from 'antd';
import type { Transaction } from '../../../shared/services/transaction.service';
import { formatCurrency } from '../../../shared/utils/currency';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ViewTransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ViewTransactionModal: React.FC<ViewTransactionModalProps> = ({
  open,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  return (
    <Modal
      title="Detalhes da Transação"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>,
      ]}
      width={700}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Tipo">
          {transaction.type === 'IN' ? (
            <Tag color="green">Entrada</Tag>
          ) : (
            <Tag color="red">Saída</Tag>
          )}
        </Descriptions.Item>
        
        <Descriptions.Item label="Valor">
          <Text strong style={{ 
            fontSize: '18px',
            color: transaction.type === 'IN' ? '#52c41a' : '#ff4d4f'
          }}>
            {transaction.type === 'IN' ? '+' : '-'} {formatCurrency(transaction.amount)}
          </Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Descrição">
          {transaction.description || '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Categoria">
          {transaction.category?.name || '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Método de Pagamento">
          {transaction.payment_method?.name || '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label="Status">
          {transaction.status === 'CONFIRMED' && <Tag color="green">Confirmado</Tag>}
          {transaction.status === 'PENDING' && <Tag color="orange">Pendente</Tag>}
          {transaction.status === 'CANCELLED' && <Tag color="red">Cancelado</Tag>}
        </Descriptions.Item>
        
        <Descriptions.Item label="Data/Hora">
          {transaction.occurred_at
            ? dayjs(transaction.occurred_at).format('DD/MM/YYYY HH:mm:ss')
            : '-'}
        </Descriptions.Item>
        
        {transaction.created_by && (
          <Descriptions.Item label="Criado por">
            {transaction.created_by.name}
          </Descriptions.Item>
        )}
        
        {transaction.created_at && (
          <Descriptions.Item label="Data de Criação">
            {dayjs(transaction.created_at).format('DD/MM/YYYY HH:mm:ss')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

