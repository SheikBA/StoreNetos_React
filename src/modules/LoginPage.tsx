import React, { useState } from 'react';
import { loginAdmin, updateAdminPassword } from '../services/storeService';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Estados para actualizar contraseña
  const [updateUser, setUpdateUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [repeatPass, setRepeatPass] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const isValid = await loginAdmin(username, password);
    
    if (isValid) {
      // alert("¡Bienvenido Administrador!");
      onLoginSuccess();
    } else {
      setError("El usuario ó contraseña son incorrectos, intente nuevamente");
    }
  };

  const handleUpdatePassword = async () => {
    if (!updateUser || !newPass || !repeatPass) {
      setUpdateMsg("Todos los campos son obligatorios");
      return;
    }
    if (newPass !== repeatPass) {
      setUpdateMsg("Las contraseñas no coinciden");
      return;
    }

    try {
      const success = await updateAdminPassword(updateUser, newPass);
      if (success) {
        alert("Contraseña actualizada correctamente");
        setShowUpdateModal(false);
        setUpdateUser('');
        setNewPass('');
        setRepeatPass('');
        setUpdateMsg('');
      } else {
        setUpdateMsg("El usuario no existe");
      }
    } catch (e) {
      setUpdateMsg("Error al actualizar");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif' }}>
      {/* Lado Izquierdo - Imagen Servicios */}
      <div style={{ 
        flex: 1, 
        backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=1350&q=80)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(107, 63, 181, 0.4)' }}></div>
        <div style={{ position: 'absolute', bottom: 40, left: 40, color: 'white' }}>
          <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Store Netos</h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>Panel Administrativo</p>
        </div>
      </div>

      {/* Lado Derecho - Login Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f7fa', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#333', margin: '0 0 10px 0' }}>Iniciar Sesión</h2>
            <p style={{ color: '#666', margin: 0 }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 600 }}>Usuario</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }}
                placeholder="admin"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 600 }}>Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>

            {error && <div style={{ color: '#d50000', background: '#ffebee', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

            <button type="submit" style={{ width: '100%', padding: '14px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s' }}>
              INGRESAR
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setShowUpdateModal(true)} style={{ background: 'none', border: 'none', color: '#6b3fb5', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
              Actualizar contraseña
            </button>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>
              ← Volver a la tienda
            </button>
          </div>
        </div>
      </div>

      {/* Modal Actualizar Contraseña */}
      {showUpdateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '350px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Actualizar Contraseña</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 600 }}>Usuario</label>
              <input type="text" value={updateUser} onChange={e => setUpdateUser(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 600 }}>Contraseña Nueva</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 600 }}>Repita la contraseña</label>
              <input type="password" value={repeatPass} onChange={e => setRepeatPass(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            {updateMsg && <div style={{ color: updateMsg.includes('correctamente') ? 'green' : 'red', fontSize: '13px', marginBottom: '15px' }}>{updateMsg}</div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleUpdatePassword} style={{ flex: 1, padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>Aceptar</button>
              <button onClick={() => setShowUpdateModal(false)} style={{ flex: 1, padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;