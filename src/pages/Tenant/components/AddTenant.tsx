import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, Select, Avatar, Tag, Space, Typography, message } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { tenantService, type Tenant as TenantType } from '../../../shared/services/tenant.service';
import { moduleService, type Module } from '../../../shared/services/module.service';
import { userService, type User } from '../../../shared/services/user.service';

const { Text } = Typography;

interface AddTenantProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant?: TenantType | null;
}

export const AddTenant: React.FC<AddTenantProps> = ({ open, onClose, onSuccess, tenant }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isEdit = !!tenant;

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        setLoadingModules(true);
        const m = await moduleService.list();
        setModules(m);
      } catch (err: any) {
        message.error('Erro ao carregar módulos');
      } finally {
        setLoadingModules(false);
      }

      try {
        setLoadingUsers(true);
        const u = await userService.list();
        setUsers(u);
      } catch (err: any) {
        message.error('Erro ao carregar usuários');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (tenant) {
      // Converter active_modules para números (IDs)
      const moduleIds = (tenant.active_modules || []).map((mod) => {
        // Se for objeto Module, pegar o ID
        if (typeof mod === 'object' && mod !== null && 'id' in mod) {
          return (mod as Module).id;
        }
        // Se já for número, retornar direto
        if (typeof mod === 'number') return mod;
        // Se for string, tentar encontrar o módulo pelo slug/name e pegar o ID
        const module = modules.find((m) => m.slug === mod || m.name === mod);
        return module?.id;
      }).filter((id): id is number => typeof id === 'number');

      // Pegar o admin_user_id: primeiro tenta do campo direto, senão pega o primeiro usuário do array users
      let adminUserId = tenant.admin_user_id;
      if (!adminUserId && tenant.users && tenant.users.length > 0) {
        adminUserId = tenant.users[0].id;
      }

      form.setFieldsValue({
        name: tenant.name,
        active: tenant.active ?? true,
        active_modules: moduleIds,
        admin_user_id: adminUserId,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        active: true,
        active_modules: [],
      });
    }
  }, [open, tenant, modules]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Garantir que active_modules seja um array de números (IDs)
      const moduleIds = Array.isArray(values.active_modules)
        ? values.active_modules.map((mod: any) => {
            // Se já for número, retornar direto
            if (typeof mod === 'number') return mod;
            // Se for string (slug/name), encontrar o módulo e pegar o ID
            const module = modules.find((m) => m.slug === mod || m.name === mod);
            return module?.id;
          }).filter((id: any): id is number => typeof id === 'number')
        : [];

      const payload = {
        name: values.name,
        active: values.active ?? true,
        active_modules: moduleIds,
        admin_user_id: values.admin_user_id,
      };

      if (isEdit && tenant?.id) {
        await tenantService.update(tenant.id, payload);
        message.success('Tenant atualizado com sucesso!');
      } else {
        await tenantService.create(payload);
        message.success('Tenant criado com sucesso!');
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error('Erro ao salvar tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar Tenant' : 'Novo Tenant'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">

        <Form.Item
          name="name"
          label="Nome"
          rules={[{ required: true, message: 'Insira o nome' }]}
        >
          <Input placeholder="Nome do tenant" />
        </Form.Item>

        <Form.Item
          name="admin_user_id"
          label="Usuário Admin"
          rules={[{ required: true, message: 'Selecione um admin' }]}
        >
          <Select
            placeholder="Selecione o admin"
            loading={loadingUsers}
            showSearch
            allowClear
            optionFilterProp="value"
            filterOption={(input, option) => {
              const user = users.find((u) => u.id === option?.value);
              if (!user) return false;
              const text = `${user.name} ${user.email}`.toLowerCase();
              return text.includes(input.toLowerCase());
            }}
            options={users.map((user) => ({
              value: user.id,
              label: (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <div>
                    <Text strong>{user.name}</Text>
                    {(user.role?.toLowerCase() === 'super admin' || user.is_super_admin) && (
                      <Tag color="gold" style={{ marginLeft: 6, fontSize: 11 }}>Super Admin</Tag>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {user.email}
                      </Text>
                    </div>
                  </div>
                </Space>
              )
            }))}
          />
        </Form.Item>

        <Form.Item
          name="active_modules"
          label="Módulos Ativos"
          rules={[{ required: true, message: 'Selecione os módulos' }]}
        >
          <Select
            mode="multiple"
            placeholder="Selecione os módulos"
            loading={loadingModules}
            showSearch
            allowClear
            optionFilterProp="value"
            filterOption={(input, option) => {
              const module = modules.find((m) => m.id === option?.value);
              if (!module) return false;
              const text = `${module.name} ${module.description || ''}`.toLowerCase();
              return text.includes(input.toLowerCase());
            }}
            tagRender={({ value, onClose, closable }) => {
              const mod = modules.find((m) => m.id === value);
              return (
                <Tag color="blue" closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
                  {mod?.name || value}
                </Tag>
              );
            }}
            options={modules
              .filter((m) => m.is_active !== false)
              .map((module) => ({
                value: module.id,
                label: (
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>{module.name}</Text>
                      {module.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {module.description}
                        </Text>
                      )}
                    </div>
                  </Space>
                )
              }))}
          />
        </Form.Item>

        <Form.Item name="active" label="Status" valuePropName="checked">
          <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
        </Form.Item>

      </Form>
    </Modal>
  );
};
