import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../shared/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requiredPermissions?: string[];
  requiredModules?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
  requiredPermissions = [],
  requiredModules = [],
}) => {
  const { isAuthenticated, isLoading, isSuperAdmin, hasPermission, hasModule } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" tip="Carregando..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions.length > 0 && !requiredPermissions.every(hasPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredModules.length > 0 && !requiredModules.every(hasModule)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

