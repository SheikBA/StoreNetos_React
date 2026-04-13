import React, { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from 'react-router-dom';
import { loginAdmin, updateAdminPassword } from '../services/storeService';
import Toast from './Toast';

// Añadimos la prop onLoginSuccess
interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();

  // Limpieza del ReCAPTCHA al desmontar el componente
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setToast({ message: "Por favor, confirma que no eres un robot.", type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim();
      
      if (isUpdateMode) {
        if (!newPassword.trim()) {
          setToast({ message: "La nueva contraseña no puede estar vacía.", type: 'error' });
          setLoading(false);
          return;
        }

        if (newPassword.length < 8) {
          setToast({ message: "La nueva contraseña debe tener al menos 8 caracteres.", type: 'error' });
          setLoading(false);
          return;
        }

        // Primero validamos la identidad con la contraseña actual
        const isValid = await loginAdmin(cleanUsername, password, captchaToken);
        if (!isValid) {
          setToast({ message: "La contraseña actual es incorrecta o el captcha expiró.", type: 'error' });
          setCaptchaToken(null);
          recaptchaRef.current?.reset();
          return;
        }

        // Si es válida, procedemos a actualizar
        const updated = await updateAdminPassword(cleanUsername, newPassword);
        if (updated) {
          setToast({ message: "¡Contraseña actualizada con éxito! Ya puedes ingresar.", type: 'success' });
          setIsUpdateMode(false);
          setPassword('');
          setNewPassword('');
          setCaptchaToken(null);
          // Resetear el widget visualmente
          recaptchaRef.current?.reset();
        } else {
          setToast({ message: "No se pudo actualizar el registro del usuario.", type: 'error' });
        }
      } else {
        const success = await loginAdmin(cleanUsername, password, captchaToken);
        if (success) {
          // Guardar estado de autenticación para que ProtectedRoute lo reconozca
          localStorage.setItem('isLoggedIn', 'true');
          setToast({ message: "¡Bienvenido! Redirigiendo...", type: 'success' });

          // Usamos el callback del padre para disparar la reactividad en App.tsx
          setTimeout(() => {
            setCaptchaToken(null); // Limpieza antes de salir
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              navigate('/Admin');
            }
          }, 1000);
        } else {
          setToast({ message: "Usuario o contraseña incorrectos.", type: 'error' });
          setCaptchaToken(null);
          recaptchaRef.current?.reset();
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      setToast({ message: "Error inesperado: " + (error instanceof Error ? error.message : "Error desconocido"), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <h2>Acceso Administrativo</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="Usuario" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="password" 
            placeholder={isUpdateMode ? "Contraseña Actual" : "Contraseña"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        {isUpdateMode && (
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="password" 
              placeholder="Nueva Contraseña" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}
        
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ""}
          onChange={(token) => setCaptchaToken(token)}
        />

        <button type="submit" disabled={loading || !captchaToken} style={{ marginTop: '10px', width: '100%', padding: '10px' }}>
          {loading ? "Procesando..." : (isUpdateMode ? "Actualizar Contraseña" : "Ingresar")}
        </button>
      </form>
      
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <button 
          onClick={() => {
            setIsUpdateMode(!isUpdateMode);
            setCaptchaToken(null);
            recaptchaRef.current?.reset();
          }} 
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
        >
          {isUpdateMode ? "Volver al Login" : "¿Deseas cambiar tu contraseña?"}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;