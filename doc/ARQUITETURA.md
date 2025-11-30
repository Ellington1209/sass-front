# Arquitetura do Projeto SaaS

## Estrutura de Pastas

```
src/
├── modules/              # Módulos do sistema (Auth, Estoque, Cliente, Financeiro, etc.)
│   └── Auth/
│       ├── pages/        # Páginas do módulo
│       ├── components/   # Componentes específicos do módulo
│       └── index.ts      # Exportações do módulo
├── shared/               # Código compartilhado entre módulos
│   ├── contexts/         # Contextos React (AuthContext, etc.)
│   ├── components/       # Componentes compartilhados
│   ├── services/         # Serviços (API, Auth, etc.)
│   └── types/           # Tipos TypeScript compartilhados
└── pages/               # Páginas gerais (Dashboard, etc.)
```

## Sistema de Autenticação

### Contexto de Autenticação

O `AuthContext` gerencia o estado de autenticação globalmente:

```typescript
const { 
  user,              // Dados do usuário
  permissions,       // Array de permissões
  modules,           // Array de módulos ativos
  token,             // Token JWT
  isAuthenticated,   // Status de autenticação
  login,             // Função de login
  logout,            // Função de logout
  hasPermission,     // Verifica se tem permissão
  hasModule,         // Verifica se tem módulo
  isSuperAdmin       // Verifica se é super admin
} = useAuth();
```

### Rotas Protegidas

Use o componente `ProtectedRoute` para proteger rotas:

```typescript
// Rota protegida básica
<ProtectedRoute>
  <MinhaComponente />
</ProtectedRoute>

// Rota apenas para super admin
<ProtectedRoute requireSuperAdmin>
  <AdminComponente />
</ProtectedRoute>

// Rota com permissões específicas
<ProtectedRoute requiredPermissions={['estoque.create', 'estoque.read']}>
  <EstoqueComponente />
</ProtectedRoute>

// Rota com módulos específicos
<ProtectedRoute requiredModules={['Estoque']}>
  <EstoqueComponente />
</ProtectedRoute>

// Combinando condições
<ProtectedRoute 
  requiredModules={['Financeiro']}
  requiredPermissions={['financeiro.view']}
>
  <FinanceiroComponente />
</ProtectedRoute>
```

## Gerenciamento de Token

O token é automaticamente:
- Salvo no `localStorage` após login
- Adicionado em todas as requisições HTTP via interceptor
- Removido quando o usuário faz logout
- Limpo quando recebe erro 401 (não autorizado)

## Criando Novos Módulos

### 1. Criar estrutura do módulo

```
src/modules/Estoque/
├── pages/
│   └── EstoqueListPage.tsx
├── components/
│   └── EstoqueForm.tsx
└── index.ts
```

### 2. Exportar do módulo

```typescript
// src/modules/Estoque/index.ts
export { EstoqueListPage } from './pages/EstoqueListPage';
export { EstoqueForm } from './components/EstoqueForm';
```

### 3. Adicionar rotas

```typescript
// src/App.tsx
import { EstoqueListPage } from './modules/Estoque';

<Route
  path="/estoque"
  element={
    <ProtectedRoute requiredModules={['Estoque']}>
      <EstoqueListPage />
    </ProtectedRoute>
  }
/>
```

## Sistema de Menu Condicional

Para criar menus condicionais baseados em módulos e permissões:

```typescript
import { useAuth } from '../shared/contexts/AuthContext';

const MenuComponent = () => {
  const { hasModule, hasPermission, isSuperAdmin } = useAuth();

  const menuItems = [
    // Menu para super admin
    ...(isSuperAdmin() ? [
      { key: 'admin', label: 'Administração' }
    ] : []),
    
    // Menu baseado em módulo
    ...(hasModule('Estoque') ? [
      { 
        key: 'estoque', 
        label: 'Estoque',
        children: [
          ...(hasPermission('estoque.view') ? [
            { key: 'estoque.list', label: 'Listar' }
          ] : []),
          ...(hasPermission('estoque.create') ? [
            { key: 'estoque.create', label: 'Criar' }
          ] : []),
        ]
      }
    ] : []),
    
    // Menu baseado em permissão
    ...(hasPermission('financeiro.view') ? [
      { key: 'financeiro', label: 'Financeiro' }
    ] : []),
  ];

  return <Menu items={menuItems} />;
};
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
VITE_API_BASE_URL=http://localhost:8000/api
```



