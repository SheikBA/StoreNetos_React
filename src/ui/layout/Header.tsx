import React, { useState } from 'react';
import './Header.css';
import BalanceModal from '../modals/BalanceModal';
import { Client } from '../../mock/clients';

interface CartItem {
  product: { id: string };
  quantity: number;
}

interface HeaderProps {
  cartItems?: CartItem[];
  onOpenCart: () => void;
  showCartButton?: boolean;
  clients: Client[];
}

const Header: React.FC<HeaderProps> = ({ cartItems = [], onOpenCart, showCartButton = true, clients }) => {
  const [showBalance, setShowBalance] = useState(false);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="Logo_StoreNetos_V2.png" alt="Store Netos Logo" style={{ height: 56, marginRight: 16, filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))', transition: 'all 0.3s ease' }} />
        <div>
          <h1 style={{ fontWeight: 900, color: '#fff', fontSize: 36, margin: 0, letterSpacing: '1px' }}>STORE NETOS</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Tu tienda de confianza</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'absolute', right: 32, top: 24 }}>
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
        clients={clients}
      />
    </header>
  );
};

export default Header;
