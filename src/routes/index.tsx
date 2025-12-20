import { Routes, Route, Navigate } from 'react-router-dom';

import { Agenda, DashboardPage, LoginPage, PermissoesUsuarios, Profissionais, Students, Tenant, UnauthorizedPage, WhatsApp } from '../pages';
import { ProtectedLayout } from './ProtectedLayout';
import { PublicRoute } from './PublicRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/unauthorized" element={<ProtectedLayout><UnauthorizedPage /></ProtectedLayout>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

     
      <Route path="/admin">         
        <Route path="tenants" element={<ProtectedLayout><Tenant /></ProtectedLayout>} />
      </Route>

      <Route path="/students" element={<ProtectedLayout><Students /></ProtectedLayout>} />
      <Route path="/profissionais" element={<ProtectedLayout><Profissionais /></ProtectedLayout>} />
      <Route path="/agenda" element={<ProtectedLayout><Agenda /></ProtectedLayout>} />
      <Route path="/whatsapp" element={<ProtectedLayout><WhatsApp /></ProtectedLayout>} />


      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />

      <Route path="/settings/permissions-and-users" element={<ProtectedLayout><PermissoesUsuarios /></ProtectedLayout>} />
    </Routes>
  );
};
