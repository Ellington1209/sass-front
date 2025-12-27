import React, { useEffect, useState } from 'react';
import { Modal, Form, InputNumber, Select, Input, message, Space, Typography, DatePicker, Radio, Button } from 'antd';
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { transactionService, type CreateTransactionRequest } from '../../../shared/services/transaction.service';
import { financialCategoryService, type FinancialCategory } from '../../../shared/services/financial-category.service';
import { paymentMethodService, type PaymentMethod } from '../../../shared/services/payment-method.service';
import { formatCurrency } from '../../../shared/utils/currency';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [categoryForm] = Form.useForm();
  const [paymentMethodForm] = Form.useForm();
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Buscar opções
    const fetchOptions = async () => {
      try {
        setLoadingCategories(true);
        setLoadingPaymentMethods(true);
        
        const [categoriesData, paymentMethodsData] = await Promise.all([
          financialCategoryService.list({ active: true }).catch(() => []),
          paymentMethodService.list({ active: true }).catch(() => [])
        ]);
        
        setCategories(categoriesData);
        setPaymentMethods(paymentMethodsData);
      } catch (error: any) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setLoadingCategories(false);
        setLoadingPaymentMethods(false);
      }
    };

    fetchOptions();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue({
      type: 'IN',
      status: 'PENDING',
      occurred_at: dayjs(),
    });
    setTransactionType('IN');
  }, [open, form]);

  const handleTypeChange = (e: any) => {
    const newType = e.target.value;
    setTransactionType(newType);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const transactionData: CreateTransactionRequest = {
        type: values.type,
        amount: values.amount,
        description: values.description || undefined,
        category_id: values.category_id,
        payment_method_id: values.payment_method_id,
        reference_type: values.reference_type || null,
        reference_id: values.reference_id || null,
        status: values.status || 'PENDING',
        occurred_at: values.occurred_at
          ? dayjs(values.occurred_at).format('YYYY-MM-DD HH:mm:ss')
          : undefined,
      };

      await transactionService.create(transactionData);
      message.success('Transação criada com sucesso!');

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      if (error?.errorFields) {
        message.error('Por favor, verifique os campos do formulário');
      } else {
        message.error(error?.response?.data?.message || 'Erro ao criar transação');
      }
    } finally {
      setSaving(false);
    }
  };

  // Mostrar todas as categorias (não há mais filtro por tipo)
  // Recomendado filtrar por is_operational: false para lançamentos manuais
  const filteredCategories = categories.filter(c => !c.is_operational);

  return (
    <Modal
      title={
        <Space>
          <Text strong>Novo Lançamento Financeiro</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'IN',
          status: 'CONFIRMED',
          occurred_at: dayjs(),
        }}
      >
        <Form.Item
          name="type"
          label="Tipo de Transação"
          rules={[{ required: true, message: 'Selecione o tipo de transação' }]}
        >
          <Radio.Group onChange={handleTypeChange} value={transactionType}>
            <Space direction="vertical">
              <Radio value="IN">
                <Space>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} />
                  <Text>Entrada (Receita)</Text>
                </Space>
              </Radio>
              <Radio value="OUT">
                <Space>
                  <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                  <Text>Saída (Despesa)</Text>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Valor"
          rules={[
            { required: true, message: 'Informe o valor' },
            { type: 'number', min: 0.01, message: 'O valor deve ser maior que zero' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={0.01}
            precision={2}
            placeholder="0,00"
            prefix="R$"
            formatter={(value) => {
              if (!value) return '';
              return formatCurrency(Number(value));
            }}
            parser={(value) => {
              if (!value) return 0;
              const cleaned = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
              const num = parseFloat(cleaned);
              return isNaN(num) ? 0 : num;
            }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descrição"
          extra="Descrição opcional da transação (máx 1000 caracteres)"
        >
          <TextArea
            rows={3}
            placeholder="Ex: Venda avulsa de produtos de limpeza"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="category_id"
          label={
            <Space>
              <span>Categoria</span>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setCategoryModalOpen(true)}
                style={{ padding: 0, height: 'auto' }}
              >
                Criar nova categoria
              </Button>
            </Space>
          }
          rules={[{ required: true, message: 'Selecione a categoria' }]}
          extra="Selecione uma categoria (recomendado usar categorias não operacionais para lançamentos manuais)"
        >
          <Select
            placeholder="Selecione a categoria"
            loading={loadingCategories}
            showSearch
            filterOption={(input, option) => {
              const label = String(option?.label || option?.children || '');
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {filteredCategories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="payment_method_id"
          label={
            <Space>
              <span>Método de Pagamento</span>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setPaymentMethodModalOpen(true)}
                style={{ padding: 0, height: 'auto' }}
              >
                Criar novo método
              </Button>
            </Space>
          }
          rules={[{ required: true, message: 'Selecione o método de pagamento' }]}
        >
          <Select
            placeholder="Selecione o método de pagamento"
            loading={loadingPaymentMethods}
            showSearch
            filterOption={(input, option) => {
              const label = String(option?.label || option?.children || '');
              return label.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {paymentMethods.map((method) => (
              <Option key={method.id} value={method.id}>
                {method.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
        >
          <Select>
            <Option value="CONFIRMED">Confirmado</Option>
            <Option value="PENDING">Pendente</Option>
            <Option value="CANCELLED">Cancelado</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="occurred_at"
          label="Data/Hora da Transação"
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            placeholder="Selecione a data e hora"
          />
        </Form.Item>
      </Form>

      {/* Modal para criar categoria */}
      <Modal
        title="Criar Nova Categoria"
        open={categoryModalOpen}
        onCancel={() => {
          setCategoryModalOpen(false);
          categoryForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await categoryForm.validateFields();
            setSavingCategory(true);
            
            const newCategory = await financialCategoryService.create({
              name: values.name,
              is_operational: false, // Para lançamentos manuais
              active: values.active !== false,
            });
            
            message.success('Categoria criada com sucesso!');
            
            // Atualizar lista de categorias
            const updatedCategories = await financialCategoryService.list({ active: true });
            setCategories(updatedCategories);
            
            // Selecionar a categoria recém-criada
            form.setFieldsValue({ category_id: newCategory.id });
            
            setCategoryModalOpen(false);
            categoryForm.resetFields();
          } catch (error: any) {
            if (error?.errorFields) {
              message.error('Por favor, verifique os campos do formulário');
            } else {
              message.error(error?.response?.data?.message || 'Erro ao criar categoria');
            }
          } finally {
            setSavingCategory(false);
          }
        }}
        confirmLoading={savingCategory}
        width={500}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          initialValues={{
            active: true,
            is_operational: false,
          }}
        >
          <Form.Item
            name="name"
            label="Nome da Categoria"
            rules={[
              { required: true, message: 'Informe o nome da categoria' },
              { max: 255, message: 'O nome deve ter no máximo 255 caracteres' },
            ]}
          >
            <Input placeholder="Ex: Impostos, Taxas Bancárias" />
          </Form.Item>
          
          <Form.Item
            name="active"
            label="Status"
          >
            <Select>
              <Option value={true}>Ativa</Option>
              <Option value={false}>Inativa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para criar método de pagamento */}
      <Modal
        title="Criar Novo Método de Pagamento"
        open={paymentMethodModalOpen}
        onCancel={() => {
          setPaymentMethodModalOpen(false);
          paymentMethodForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await paymentMethodForm.validateFields();
            setSavingPaymentMethod(true);
            
            const newMethod = await paymentMethodService.create({
              name: values.name,
              active: values.active !== false,
            });
            
            message.success('Método de pagamento criado com sucesso!');
            
            // Atualizar lista de métodos de pagamento
            const updatedMethods = await paymentMethodService.list({ active: true });
            setPaymentMethods(updatedMethods);
            
            // Selecionar o método recém-criado
            form.setFieldsValue({ payment_method_id: newMethod.id });
            
            setPaymentMethodModalOpen(false);
            paymentMethodForm.resetFields();
          } catch (error: any) {
            if (error?.errorFields) {
              message.error('Por favor, verifique os campos do formulário');
            } else {
              message.error(error?.response?.data?.message || 'Erro ao criar método de pagamento');
            }
          } finally {
            setSavingPaymentMethod(false);
          }
        }}
        confirmLoading={savingPaymentMethod}
        width={500}
      >
        <Form
          form={paymentMethodForm}
          layout="vertical"
          initialValues={{
            active: true,
          }}
        >
          <Form.Item
            name="name"
            label="Nome do Método de Pagamento"
            rules={[
              { required: true, message: 'Informe o nome do método de pagamento' },
              { max: 255, message: 'O nome deve ter no máximo 255 caracteres' },
            ]}
          >
            <Input placeholder="Ex: Cartão de Débito, Transferência" />
          </Form.Item>
          
          <Form.Item
            name="active"
            label="Status"
          >
            <Select>
              <Option value={true}>Ativo</Option>
              <Option value={false}>Inativo</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

