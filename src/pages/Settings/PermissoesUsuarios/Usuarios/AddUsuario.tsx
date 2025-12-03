import { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { userService, type User as UserType } from '../../../../shared/services/user.service';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface AddUsuarioProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserType | null;
}

export const AddUsuario: React.FC<AddUsuarioProps> = ({ open, onClose, onSuccess, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const isEdit = !!user;

  useEffect(() => {
    if (!open) return;

    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      });
    } else {
      form.resetFields();
    }
  }, [open, user, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const payload: any = {
        name: values.name,
        email: values.email,
        tenant_id: currentUser?.tenant_id || null,
        is_super_admin: false,
      };

      // Só adiciona password se for criação (não edição)
      if (!isEdit) {
        payload.password = values.password;
      } else if (values.password) {
        // Se estiver editando e forneceu nova senha
        payload.password = values.password;
      }

      if (isEdit && user?.id) {
        await userService.update(user.id, payload);
        message.success('Usuário atualizado com sucesso!');
      } else {
        await userService.create(payload);
        message.success('Usuário criado com sucesso!');
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Usuário' : 'Novo Usuário'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Form.Item
          name="name"
          label="Nome"
          rules={[{ required: true, message: 'Insira o nome' }]}
        >
          <Input placeholder="Nome do usuário" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Insira o email' },
            { type: 'email', message: 'Email inválido' },
          ]}
        >
          <Input placeholder="email@exemplo.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label={isEdit ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
          rules={
            !isEdit
              ? [
                  { required: true, message: 'Insira a senha' },
                  { min: 6, message: 'A senha deve ter no mínimo 6 caracteres' },
                ]
              : [{ min: 6, message: 'A senha deve ter no mínimo 6 caracteres' }]
          }
        >
          <Input.Password placeholder={isEdit ? 'Nova senha (opcional)' : 'Senha'} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
