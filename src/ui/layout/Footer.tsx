import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const ModalOverlay = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        color: 'var(--text-main)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="Logo_StoreNetos_V2.png" alt="Logo" style={{ height: 32 }} />
            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '18px' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--danger)' }}>&times;</button>
        </div>
        <div style={{ lineHeight: '1.6' }}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <>
    <footer style={{
    background: 'var(--primary)',
    color: 'white',
    padding: '40px 24px',
    marginTop: '60px',
    borderTop: '3px solid var(--shadow-card)'
  }}>
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px'
    }}>
      {/* Información */}
      <div>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Store Netos</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: 14, lineHeight: 1.6, color: '#eee' }}>
          Tu tienda online de confianza para productos de calidad a precios competitivos.
        </p>
        <div style={{ fontSize: 12, color: '#bbb' }}>
          <p style={{ margin: '4px 0' }}>📍 Cancun, Qroo México, Puerto Cancun</p>
          <p style={{ margin: '4px 0' }}>📧 SheikVladislav@Gmail.com</p>
          <p style={{ margin: '4px 0' }}>📱 99 81 07 68 23</p>
        </div>
      </div>

      {/* Enlaces Rápidos */}
      <div>
        <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Enlaces Rápidos</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 8 }}><a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>→ Catálogo de Productos</a></li>
          <li style={{ marginBottom: 8 }}>
            <button 
              onClick={() => setShowPrivacy(true)} 
              style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'none', fontSize: 14, cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
            >
              → Política de Privacidad
            </button>
          </li>
          <li style={{ marginBottom: 8 }}>
            <button 
              onClick={() => setShowTerms(true)} 
              style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'none', fontSize: 14, cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
            >
              → Términos y Condiciones
            </button>
          </li>
          <li style={{ marginBottom: 8 }}><a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: 14 }}>→ Contacto</a></li>
        </ul>
      </div>

      {/* Redes Sociales */}
      <div>
        <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Síguenos</h4>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            color: 'white',
            textDecoration: 'none',
            fontSize: 20,
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} 
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = 'var(--morado-primario)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = 'white';
          }}>
            f
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            color: 'white',
            textDecoration: 'none',
            fontSize: 20,
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = 'var(--morado-primario)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = 'white';
          }}>
            📷
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            color: 'white',
            textDecoration: 'none',
            fontSize: 20,
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = 'var(--morado-primario)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = 'white';
          }}>
            🎵
          </a>
        </div>
      </div>
    </div>

    {/* Copyright */}
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.1)',
      marginTop: 40,
      paddingTop: 20,
      textAlign: 'center',
      fontSize: 12,
      color: '#bbb'
    }}>
      <p style={{ margin: 0 }}>© 2026 Store Netos. Todos los derechos reservados.</p>
      <p style={{ margin: '8px 0 0 0' }}>Diseñado con ❤️ para tu comodidad</p>
    </div>
  </footer>

  {showPrivacy && (
    <ModalOverlay title="Política de Privacidad" onClose={() => setShowPrivacy(false)}>
      <p><strong>Política de Privacidad de Store Netos</strong></p>
      <p>Para el uso de esta aplicación web, establecemos las siguientes políticas mínimas necesarias:</p>
      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
        <li><strong>Recopilación de Datos:</strong> Solo recopilamos la información esencial para procesar sus pedidos y mantener el historial de su carrito.</li>
        <li><strong>Uso de la Información:</strong> Los datos proporcionados se utilizan exclusivamente para fines de operación interna y ventas.</li>
        <li><strong>Almacenamiento Local:</strong> Utilizamos tecnologías de almacenamiento local para mejorar su experiencia de usuario.</li>
        <li><strong>Confidencialidad:</strong> Su información no será compartida con terceros sin su consentimiento explícito.</li>
      </ul>
    </ModalOverlay>
  )}

  {showTerms && (
    <ModalOverlay title="Términos y Condiciones" onClose={() => setShowTerms(false)}>
      <p><strong>Reglas de Operación:</strong></p>
      <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
        <li style={{ marginBottom: '8px' }}>La venta de productos en Store Netos es uso exclusivo y de propiedad de <strong>SheikVladislav</strong>.</li>
        <li style={{ marginBottom: '8px' }}>La venta de los productos es en el <strong>5to piso</strong> de la empresa Hotel Shops.</li>
        <li style={{ marginBottom: '8px' }}>No hay entrega personalizada, la compra se hace en línea y posterior se debe ir a buscar el producto comprado.</li>
        <li style={{ marginBottom: '8px' }}>Los precios mostrados en la interfaz web Store Netos están sujetos a cambios sin previo aviso.</li>
        <li style={{ marginBottom: '8px' }}>Es responsabilidad del cliente tomar el producto físicamente a más tardar <strong>30 min después de la compra</strong>, Store Netos no se hace responsable.</li>
      </ol>
    </ModalOverlay>
  )}
  </>
);
};

export default Footer;
