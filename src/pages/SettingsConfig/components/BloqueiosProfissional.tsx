import { useState, useEffect } from 'react';
import { Form, Row, Col, DatePicker, Button, Card, message, Space, Spin, Select, Modal, Input, Table, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { blockService, type Block } from '../../../shared/services/block.service';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { providerService, type Provider } from '../../../shared/services/provider.service';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface BloqueiosProfissionalProps {
  providerId?: number | string;
}

export const BloqueiosProfissional: React.FC<BloqueiosProfissionalProps> = ({ providerId: propProviderId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | string | undefined>(propProviderId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const { user, isTenant } = useAuth();

  // Se for admin, precisa selecionar o profissional
  const isAdmin = isTenant();

  useEffect(() => {
    if (isAdmin) {
      loadProviders();
    } else {
      // Se for profissional, buscar seu próprio provider_id
      loadMyProviderId();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedProviderId) {
      loadBlocks();
    }
  }, [selectedProviderId, dateRange]);

  const loadProviders = async () => {
    try {
      const data = await providerService.list();
      setProviders(data);
      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
      }
    } catch (error: any) {
      message.error('Erro ao carregar profissionais');
    }
  };

  const loadMyProviderId = async () => {
    try {
      const data = await providerService.list();
      const myProvider = data.find((p) => p.user?.id === user?.id);
      if (myProvider?.id) {
        setSelectedProviderId(myProvider.id);
      } else {
        message.error('Profissional não encontrado');
      }
    } catch (error: any) {
      message.error('Erro ao carregar dados do profissional');
    }
  };

  const loadBlocks = async () => {
    if (!selectedProviderId) return;

    try {
      setLoading(true);
      const params: any = {};
      if (dateRange.start) params.start = dateRange.start;
      if (dateRange.end) params.end = dateRange.end;
      
      const data = await blockService.list(selectedProviderId, params);
      setBlocks(data);
    } catch (error: any) {
      console.error('Erro ao carregar bloqueios:', error);
      message.error('Erro ao carregar bloqueios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (block?: Block) => {
    setEditingBlock(block || null);
    if (block) {
      form.setFieldsValue({
        start_at: dayjs(block.start_at),
        end_at: dayjs(block.end_at),
        reason: block.reason || '',
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBlock(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    if (!selectedProviderId) {
      message.error('Selecione um profissional');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        start_at: values.start_at.format('YYYY-MM-DD HH:mm:ss'),
        end_at: values.end_at.format('YYYY-MM-DD HH:mm:ss'),
        reason: values.reason || undefined,
      };

      if (editingBlock?.id) {
        await blockService.update(selectedProviderId, editingBlock.id, payload);
        message.success('Bloqueio atualizado com sucesso!');
      } else {
        await blockService.create(selectedProviderId, payload);
        message.success('Bloqueio criado com sucesso!');
      }

      handleCloseModal();
      loadBlocks();
    } catch (error: any) {
      console.error('Erro ao salvar bloqueio:', error);
      message.error(error?.response?.data?.message || 'Erro ao salvar bloqueio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedProviderId) return;

    try {
      await blockService.delete(selectedProviderId, id);
      message.success('Bloqueio excluído com sucesso!');
      loadBlocks();
    } catch (error: any) {
      message.error('Erro ao excluir bloqueio');
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        start: dates[0].format('YYYY-MM-DD'),
        end: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setDateRange({});
    }
  };

  const columns: ColumnsType<Block> = [
    {
      title: 'Data/Hora Início',
      dataIndex: 'start_at',
      key: 'start_at',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Data/Hora Término',
      dataIndex: 'end_at',
      key: 'end_at',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Motivo',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string) => text || <Text type="secondary">Sem motivo</Text>,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Block) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir este bloqueio?')) {
                handleDelete(record.id!);
              }
            }}
          >
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  if (!selectedProviderId && !isAdmin) {
    return (
      <Card>
        <p>Carregando dados do profissional...</p>
      </Card>
    );
  }

  return (
    <Spin spinning={loading}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {isAdmin && (
            <Form.Item label="Profissional">
              <Select
                value={selectedProviderId}
                onChange={(value) => setSelectedProviderId(value)}
                placeholder="Selecione o profissional"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={providers.map((provider) => ({
                  value: provider.id,
                  label: provider.user?.name || `Profissional ${provider.id}`,
                }))}
              />
            </Form.Item>
          )}

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                placeholder={['Data inicial', 'Data final']}
                onChange={(dates) => handleDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
                disabled={!selectedProviderId}
              >
                Novo Bloqueio
              </Button>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={blocks.map((block) => ({ ...block, key: block.id }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} bloqueio(s)`,
            }}
            locale={{
              emptyText: 'Nenhum bloqueio cadastrado',
            }}
          />
        </Space>

        <Modal
          title={editingBlock ? 'Editar Bloqueio' : 'Novo Bloqueio'}
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          confirmLoading={saving}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="start_at"
                  label="Data/Hora Início"
                  rules={[{ required: true, message: 'Selecione a data/hora de início' }]}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Início"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="end_at"
                  label="Data/Hora Término"
                  dependencies={['start_at']}
                  rules={[
                    { required: true, message: 'Selecione a data/hora de término' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startAt = getFieldValue('start_at');
                        if (startAt && value && value.isBefore(startAt)) {
                          return Promise.reject('Data/hora de término deve ser após a de início');
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Término"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="reason"
              label="Motivo (opcional)"
              rules={[{ max: 255, message: 'O motivo deve ter no máximo 255 caracteres' }]}
            >
              <Input.TextArea rows={3} placeholder="Ex: Almoço, Reunião, etc." maxLength={255} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Spin>
  );
};

