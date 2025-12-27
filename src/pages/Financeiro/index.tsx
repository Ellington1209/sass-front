import { useState, useEffect } from 'react';
import { Typography, Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../shared/contexts/AuthContext';
import { FinancialSummaryCards, TransactionTable, AddTransactionModal, ViewTransactionModal } from './components';
import { transactionService, type Transaction } from '../../shared/services/transaction.service';

const { Title } = Typography;

export const Financeiro = () => {
  const { isTenant, hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar se o usuário tem permissão para acessar esta página
  const canAccess = isTenant() && hasPermission('financeiro.view');
  const canCreate = hasPermission('financeiro.transactions.create') || hasPermission('financeiro.view');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.list();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadTransactions();
    }
  }, [refreshKey, canAccess]);

  if (!canAccess) {
    return (
      <div>
        <Title level={2}>Financeiro</Title>
        <p>Você não tem permissão para acessar esta página. Apenas administradores de tenant podem acessar o financeiro.</p>
      </div>
    );
  }

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleCloseView = () => {
    setViewModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Lançamentos Financeiros</Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            Novo Lançamento
          </Button>
        )}
      </Space>

      <FinancialSummaryCards
        transactions={transactions}
        loading={loading}
      />

      <div style={{ marginTop: 24 }}>
      <TransactionTable
        key={refreshKey}
        onAdd={handleAdd}
        onView={handleView}
        onRefresh={handleSuccess}
        onDataChange={setTransactions}
      />
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />

      <ViewTransactionModal
        open={viewModalOpen}
        onClose={handleCloseView}
        transaction={selectedTransaction}
      />
    </div>
  );
};