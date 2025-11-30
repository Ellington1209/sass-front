import { Routes, Route, Navigate } from 'react-router-dom';


import { DashboardPage, LoginPage, UnauthorizedPage } from '../pages';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={ <PublicRoute> <LoginPage /> </PublicRoute> }/>
      <Route path="/unauthorized" element={<ProtectedRoute><UnauthorizedPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />


      <Route path="/dashboard"  element={ <ProtectedRoute>  <DashboardPage />  </ProtectedRoute> } />
    </Routes>
  );
};
