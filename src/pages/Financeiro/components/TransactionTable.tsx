import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Input, message, Tag, Typography, DatePicker, Select } from 'antd';
import { EditOutlined, SearchOutlined, PlusOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';
import { AppTable, type AppTableColumn } from '../../../shared/components/Table';
import { transactionService, type Transaction } from '../../../shared/services/transaction.service';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { formatCurrency } from '../../../shared/utils/currency';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface TransactionTableProps {
  onAdd: () => void;
  onView: (transaction: Transaction) => void;
  onRefresh: () => void;
  onDataChange?: (transactions: Transaction[]) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ onAdd, onView, onRefresh, onDataChange }) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<'IN' | 'OUT' | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'CONFIRMED' | 'CANCELLED' | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const searchTimeoutRef = useRef<number | null>(null);
  
  const canView = hasPermission('financeiro.transactions.view') || hasPermission('financeiro.view');

  const fetchData = async (searchTerm?: string) => {
    try {
      setLoading(true);
      
      const params: any = {};
      
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (typeFilter) {
        params.type = typeFilter;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const data = await transactionService.list(params).catch(() => []);
      setTransactions(data);
      // Notificar componente pai sobre mudanças nos dados
      if (onDataChange) {
        onDataChange(data);
      }
    } catch (error: any) {
      message.error('Erro ao carregar transações: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter, dateRange]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchData(value);
    }, 500);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setTypeFilter(undefined);
    setStatusFilter(undefined);
    setDateRange([null, null]);
    fetchData();
  };

  const columns: AppTableColumn<Transaction>[] = [
    {
      title: 'Data/Hora',
      key: 'occurred_at',
      width: 150,
      render: (_: any, record: Transaction) => {
        return record.occurred_at
          ? dayjs(record.occurred_at).format('DD/MM/YYYY HH:mm')
          : '-';
      },
      sorter: (a, b) => {
        const dateA = a.occurred_at ? dayjs(a.occurred_at).unix() : 0;
        const dateB = b.occurred_at ? dayjs(b.occurred_at).unix() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Tipo',
      key: 'type',
      width: 100,
      render: (_: any, record: Transaction) => {
        if (record.type === 'IN') {
          return <Tag color="green">Entrada</Tag>;
        }
        return <Tag color="red">Saída</Tag>;
      },
    },
    {
      title: 'Valor',
      key: 'amount',
      width: 120,
      render: (_: any, record: Transaction) => {
        const color = record.type === 'IN' ? '#52c41a' : '#ff4d4f';
        return (
          <Text strong style={{ color, fontSize: '16px' }}>
            {record.type === 'IN' ? '+' : '-'} {formatCurrency(record.amount)}
          </Text>
        );
      },
    },
    {
      title: 'Descrição',
      key: 'description',
      render: (_: any, record: Transaction) => (
        <Text>{record.description || '-'}</Text>
      ),
    },
    {
      title: 'Categoria',
      key: 'category',
      width: 150,
      render: (_: any, record: Transaction) => (
        <Text>{record.category?.name || '-'}</Text>
      ),
    },
    {
      title: 'Método de Pagamento',
      key: 'payment_method',
      width: 150,
      render: (_: any, record: Transaction) => (
        <Text>{record.payment_method?.name || '-'}</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: Transaction) => {
        if (record.status === 'CONFIRMED') {
          return <Tag color="green">Confirmado</Tag>;
        }
        if (record.status === 'PENDING') {
          return <Tag color="orange">Pendente</Tag>;
        }
        return <Tag color="red">Cancelado</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_: any, record: Transaction) => {
        if (!canView) {
          return null;
        }
        
        return (
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            title="Visualizar"
          />
        );
      },
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Buscar por descrição"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          
          <Select
            placeholder="Tipo"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
          >
            <Select.Option value="IN">Entrada</Select.Option>
            <Select.Option value="OUT">Saída</Select.Option>
          </Select>
          
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="PENDING">Pendente</Select.Option>
            <Select.Option value="CONFIRMED">Confirmado</Select.Option>
            <Select.Option value="CANCELLED">Cancelado</Select.Option>
          </Select>
          
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
            format="DD/MM/YYYY"
            placeholder={['Data inicial', 'Data final']}
          />
          
          <Button
            icon={<FilterOutlined />}
            onClick={handleClearFilters}
          >
            Limpar Filtros
          </Button>
        </Space>
      </Space>

      <AppTable
        columns={columns}
        dataSource={transactions.map(t => ({ ...t, key: t.id?.toString() || Math.random().toString() }))}
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} transação(ões)`,
        }}
      />
    </div>
  );
};

