import React, { useState } from 'react';
import './Header.css';
import BalanceModal from '../modals/BalanceModal';
import { Client } from '../../services/storeService';

interface CartItem {
  product: { id: string };
  quantity: number;
}

interface HeaderProps {
  cartItems?: CartItem[];
  onOpenCart: () => void;
  showCartButton?: boolean;
  onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItems = [], onOpenCart, showCartButton = true, onAdminClick }) => {
  const [showBalance, setShowBalance] = useState(false);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header-container">
      <style>{`
        .tooltip-content {
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tooltip-container:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="Logo_StoreNetos_V2.png" alt="Store Netos Logo" style={{ height: 56, marginRight: 16, filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))', transition: 'all 0.3s ease' }} />
        <div>
          <h1 style={{ fontWeight: 900, color: '#fff', fontSize: 36, margin: 0, letterSpacing: '1px' }}>STORE NETOS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Tu tienda de confianza</p>
            <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>ⓘ</span>
              <div className="tooltip-content" style={{
                width: '280px',
                backgroundColor: 'rgba(0,0,0,0.95)',
                color: '#fff',
                textAlign: 'center',
                borderRadius: '8px',
                padding: '12px',
                position: 'absolute',
                zIndex: 100,
                top: '120%',
                left: '0',
                fontSize: '12px',
                fontWeight: 'normal',
                lineHeight: '1.4',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                Store Netos es una tienda en linea de auto servición, y para poder tomar el producto y tú cambio es necesario que registres tu compra en linea ó que te anotes en la libreta con tu nombre, fecha y producto que estas comprando
                <div style={{ position: 'absolute', bottom: '100%', left: '10px', borderWidth: '6px', borderStyle: 'solid', borderColor: 'transparent transparent rgba(0,0,0,0.95) transparent' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'absolute', right: 32, top: 24 }}>
        <button className="btn-saldo" onClick={onAdminClick} style={{ transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
          ADMINISTRADOR
        </button>
        <button className="btn-saldo" onClick={() => setShowBalance(true)} style={{ transition: 'all 0.3s ease' }}>
          💰 Ver saldo
        </button>
        {showCartButton && cartCount > 0 && (
          <button className="btn-saldo" onClick={onOpenCart} style={{ background: 'var(--success)', borderColor: 'var(--success-dark)' }}>
            🛒 <span className="badge" style={{ marginLeft: 6 }}>{cartCount}</span>
          </button>
        )}
      </div>
      <BalanceModal
        open={showBalance}
        onClose={() => setShowBalance(false)}
      />
    </header>
  );
};

export default Header;
