import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import StoreNetosApp from '../modules/StoreNetosApp';
import LoginPage from '../modules/LoginPage';
import AdminPanel from '../modules/AdminPanel';
import ProtectedRoute from './ProtectedRoute';
import '../styles/App.css';

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    // Sincronizamos el estado inicial con localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isLoggedIn') === 'true');

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsAuthenticated(false);
        navigate('/Store');
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        navigate('/Admin');
    };

    return (
        <div className="App">
            <Routes>
                {/* Ruta de la Tienda (Pública) */}
                <Route path="/Store" element={<StoreNetosApp />} />

                {/* Ruta de Login de Administrador (Secreta) */}
                <Route path="/Acceso-Privado-Netos" element={<LoginPage onBack={() => navigate('/Store')} onLoginSuccess={handleLoginSuccess} />} />

                {/* Ruta del Panel de Administración */}
                <Route 
                    path="/Admin" 
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <AdminPanel onLogout={handleLogout} />
                        </ProtectedRoute>
                    } 
                />

                {/* Redirección por defecto: si entran a la raíz, van a la tienda */}
                <Route path="*" element={<Navigate to="/Store" replace />} />
            </Routes>
        </div>
    );
};

const App: React.FC = () => (
    <Router>
        <AppContent />
    </Router>
);

export default App;