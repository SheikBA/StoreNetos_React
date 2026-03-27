import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StoreNetosApp from '../modules/StoreNetosApp';
import AdminLogin from './AdminLogin';
import '../styles/App.css';

const App: React.FC = () => {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Ruta de la Tienda (Pública) */}
                    <Route path="/Store" element={<StoreNetosApp />} />

                    {/* Ruta de Login de Administrador (Oculta/Difícil de adivinar) */}
                    <Route path="/Acceso-Privado-Netos" element={<AdminLogin />} />

                    {/* Redirección por defecto: si entran a la raíz, van a la tienda */}
                    <Route path="*" element={<Navigate to="/Store" replace />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;