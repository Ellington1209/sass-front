import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { AuthProvider } from './shared/contexts/AuthContext';
import { PermissionsProvider } from './shared/contexts/PermissionsContext';
import { AppRoutes } from './routes';
import { validationMessages } from './shared/config/validationMessages';


function App() {
  return (
    <ConfigProvider 
      locale={ptBR}
      form={{
        validateMessages: validationMessages,
      }}
    >
      <AuthProvider>
        <PermissionsProvider>
          <Router>
            <AppRoutes />
          </Router>
        </PermissionsProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
