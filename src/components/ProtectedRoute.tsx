import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    // Si no está autenticado, redirige al Login y limpia cualquier rastro
    return <Navigate to="/Acceso-Privado-Netos" replace />;
  }

  return children;
};

export default ProtectedRoute;