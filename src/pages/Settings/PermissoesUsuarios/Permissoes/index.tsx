import { useState, useEffect } from 'react';
import { Select, Collapse, Checkbox, Button, Space, Typography, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { userService, type User } from '../../../../shared/services/user.service';
import { permissionService, type ModuleWithPermissions } from '../../../../shared/services/permission.service';
import { useAuth } from '../../../../shared/contexts/AuthContext';

const { Title } = Typography;
const { Panel } = Collapse;

export const Permissoes = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modules, setModules] = useState<ModuleWithPermissions[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar lista de usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.list();
        setUsers(data);
      } catch (error: any) {
        message.error('Erro ao carregar usuários: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Carregar permissões quando selecionar um usuário
  useEffect(() => {
    if (!selectedUserId || !currentUser?.tenant_id) return;

    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const response = await permissionService.getTenantPermissions(currentUser.tenant_id!, selectedUserId!);
        setModules(response.modules);
        setSelectedPermissions(response.user_permissions || []);
      } catch (error: any) {
        message.error('Erro ao carregar permissões: ' + (error.response?.data?.message || error.message));
        setModules([]);
        setSelectedPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [selectedUserId, currentUser?.tenant_id]);

  // Limpar estado quando trocar de usuário
  const handleUserChange = (userId: number | null) => {
    setSelectedUserId(userId);
    setModules([]);
    setSelectedPermissions([]);
  };

  // Atualizar permissões selecionadas localmente
  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions((prev) => [...prev, permissionId]);
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => id !== permissionId));
    }
  };

  // Salvar permissões no backend
  const handleSave = async () => {
    if (!selectedUserId) {
      message.warning('Selecione um usuário primeiro');
      return;
    }

    try {
      setSaving(true);
      await permissionService.saveUserPermissions(selectedUserId, selectedPermissions);
      message.success('Permissões salvas com sucesso!');
    } catch (error: any) {
      message.error('Erro ao salvar permissões: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Verificar se uma permissão está selecionada
  const isPermissionChecked = (permissionId: number): boolean => {
    return selectedPermissions.includes(permissionId);
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 16 }}>Gerenciar Permissões</Title>
          
          <Space style={{ width: '100%', marginBottom: 24 }}>
            <span style={{ minWidth: 120 }}>Selecione o usuário:</span>
            <Select
              style={{ minWidth: 300 }}
              placeholder="Selecione um usuário"
              loading={loading}
              value={selectedUserId}
              onChange={handleUserChange}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => {
                const user = users.find((u) => u.id === option?.value);
                if (!user) return false;
                const text = `${user.name} ${user.email}`.toLowerCase();
                return text.includes(input.toLowerCase());
              }}
              options={users.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.email})`,
              }))}
            />
          </Space>
        </div>

        {selectedUserId && (
          <div>
            {loadingPermissions ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Carregando permissões...</div>
              </div>
            ) : modules.length > 0 ? (
              <>
                <Collapse
                  defaultActiveKey={modules.map((m) => m.id.toString())}
                  style={{ marginBottom: 24 }}
                >
                  {modules.map((module) => (
                    <Panel
                      header={
                        <span style={{ fontWeight: 500 }}>
                          {module.name}
                        </span>
                      }
                      key={module.id.toString()}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {module.permissions.map((permission) => (
                          <Checkbox
                            key={permission.id}
                            checked={isPermissionChecked(permission.id)}
                            onChange={(e) =>
                              handlePermissionChange(permission.id, e.target.checked)
                            }
                          >
                            {permission.label || permission.key}
                          </Checkbox>
                        ))}
                      </Space>
                    </Panel>
                  ))}
                </Collapse>

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  size="large"
                >
                  Salvar Permissões
                </Button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                Nenhum módulo disponível
              </div>
            )}
          </div>
        )}

        {!selectedUserId && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Selecione um usuário para gerenciar suas permissões
          </div>
        )}
      </Space>
    </div>
  );
};

