import React, { useState } from 'react';
import { Modal, Form, Input, message, Space, Typography, Button } from 'antd';
import { whatsappService } from '../../../shared/services/whatsapp.service';

const { Text } = Typography;

interface AddInstanceProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInstance: React.FC<AddInstanceProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setQrcode(null);

      const response = await whatsappService.create({
        instanceName: values.instanceName,
        number: values.number || undefined,
      });

      // Sempre exibir QR code se vier na resposta
      if (response.qrcode) {
        setQrcode(response.qrcode);
        message.success('Instância criada com sucesso! Escaneie o QR Code para conectar.');
      } else {
        message.success('Instância criada com sucesso!');
        form.resetFields();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar instância';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setQrcode(null);
    onClose();
  };

  const handleQRCodeScanned = () => {
    message.success('QR Code escaneado! Instância conectada.');
    form.resetFields();
    setQrcode(null);
    onSuccess();
    onClose();
  };

  const handleBackToList = () => {
    form.resetFields();
    setQrcode(null);
    onSuccess();
    onClose();
  };

  return (
    <Modal
      title="Nova Instância WhatsApp"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={500}
      destroyOnClose
      footer={qrcode ? null : undefined}
    >
      {qrcode ? (
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Text strong>Escaneie o QR Code com seu WhatsApp</Text>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={qrcode}
              alt="QR Code"
              style={{ maxWidth: '100%', border: '1px solid #d9d9d9', borderRadius: 4 }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            1. Abra o WhatsApp no seu celular
            <br />
            2. Vá em Configurações → Aparelhos conectados → Conectar um aparelho
            <br />
            3. Escaneie este QR Code
          </Text>
          <Space>
            <Button onClick={handleBackToList}>Voltar para Listagem</Button>
            <Button type="primary" onClick={handleQRCodeScanned}>
              Já escaneei
            </Button>
          </Space>
        </Space>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="instanceName"
            label="Nome da Instância"
            rules={[{ required: true, message: 'Insira o nome da instância' }]}
          >
            <Input placeholder="Ex: minha-instancia" />
          </Form.Item>

          <Form.Item
            name="number"
            label="Número de Telefone (Opcional)"
            rules={[
              {
                pattern: /^\d+$/,
                message: 'Apenas números são permitidos',
              },
            ]}
          >
            <Input placeholder="5511999999999" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

