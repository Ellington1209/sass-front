import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from '@ant-design/icons';
import type { Transaction } from '../../../shared/services/transaction.service';
import { formatCurrency } from '../../../shared/utils/currency';

const { Text } = Typography;

interface FinancialSummaryCardsProps {
  transactions: Transaction[];
  loading?: boolean;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  transactions,
  loading = false,
}) => {
  // Calcular totais
  const totalEntrada = transactions
    .filter(t => t.type === 'IN' && t.status === 'CONFIRMED')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSaida = transactions
    .filter(t => t.type === 'OUT' && t.status === 'CONFIRMED')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const saldo = totalEntrada - totalSaida;

  // Agrupar por categoria
  const totalsByCategory = transactions
    .filter(t => t.status === 'CONFIRMED')
    .reduce((acc, transaction) => {
      const categoryId = transaction.category_id || transaction.category?.id;
      const categoryName = transaction.category?.name || 'Sem categoria';
      
      if (!categoryId) return acc;

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          entrada: 0,
          saida: 0,
        };
      }

      if (transaction.type === 'IN') {
        acc[categoryId].entrada += transaction.amount || 0;
      } else {
        acc[categoryId].saida += transaction.amount || 0;
      }

      return acc;
    }, {} as Record<number, { id: number; name: string; entrada: number; saida: number }>);

  const categoriesArray = Object.values(totalsByCategory);

  return (
    <div>
      {/* Cards principais */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total de Entradas"
              value={totalEntrada}
              precision={2}
              prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total de Saídas"
              value={totalSaida}
              precision={2}
              prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Saldo"
              value={saldo}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: saldo >= 0 ? '#52c41a' : '#ff4d4f' }}
              loading={loading}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Cards por categoria */}
      {categoriesArray.length > 0 && (
        <div>
          <Text strong style={{ fontSize: '16px', marginBottom: 16, display: 'block' }}>
            Totais por Categoria
          </Text>
          <Row gutter={[16, 16]}>
            {categoriesArray.map((category) => {
              const saldoCategoria = category.entrada - category.saida;
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                  <Card size="small">
                    <Statistic
                      title={category.name}
                      value={saldoCategoria}
                      precision={2}
                      valueStyle={{
                        color: saldoCategoria >= 0 ? '#52c41a' : '#ff4d4f',
                        fontSize: '18px',
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <div style={{ marginTop: 8, fontSize: '12px' }}>
                      <Text type="secondary">
                        Entrada: {formatCurrency(category.entrada)} | Saída: {formatCurrency(category.saida)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </div>
  );
};

