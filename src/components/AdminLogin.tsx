import React, { useState, useRef } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/storeService';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      alert("Por favor, confirma que no eres un robot.");
      return;
    }

    setLoading(true);
    try {
      const success = await loginAdmin(username, password, captchaToken);
      
      if (success) {
        alert("¡Bienvenido!");
        // Navegación interna a la ruta de administración
        navigate('/Admin'); 
      } else {
        alert("Usuario o contraseña incorrectos.");
        // Resetear el captcha en caso de error
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    } catch (error) {
      console.error("Error en login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
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
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ""}
          onChange={(token) => setCaptchaToken(token)}
        />

        <button type="submit" disabled={loading || !captchaToken} style={{ marginTop: '10px', width: '100%', padding: '10px' }}>
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;