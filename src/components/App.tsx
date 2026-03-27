import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StoreNetosApp from '../modules/StoreNetosApp';
import LoginPage from '../modules/LoginPage';
import AdminPanel from '../modules/AdminPanel';
import '../styles/App.css';

const App: React.FC = () => {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Ruta de la Tienda (Pública) */}
                    <Route path="/Store" element={<StoreNetosApp />} />

                    {/* Ruta de Login de Administrador (Secreta) */}
                    <Route path="/Acceso-Privado-Netos" element={<LoginPage onBack={() => {}} onLoginSuccess={() => {}} />} />

                    {/* Ruta del Panel de Administración */}
                    <Route path="/Admin" element={<AdminPanel onLogout={() => {}} />} />

                    {/* Redirección por defecto: si entran a la raíz, van a la tienda */}
                    <Route path="*" element={<Navigate to="/Store" replace />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;