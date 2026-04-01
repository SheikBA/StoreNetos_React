import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import StoreNetosApp from '../modules/StoreNetosApp';
import LoginPage from '../modules/LoginPage';
import AdminPanel from '../modules/AdminPanel';
import '../styles/App.css';

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="App">
            <Routes>
                {/* Ruta de la Tienda (Pública) */}
                <Route path="/Store" element={<StoreNetosApp />} />

                {/* Ruta de Login de Administrador (Secreta) */}
                <Route path="/Acceso-Privado-Netos" element={<LoginPage onBack={() => navigate('/Store')} onLoginSuccess={() => {}} />} />

                {/* Ruta del Panel de Administración */}
                <Route path="/Admin" element={<AdminPanel onLogout={() => navigate('/Store')} />} />

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