import React, { useState } from 'react';
import { Client, getClientByUniqueId } from '../../services/storeService';
import { audioHelper } from '../../utils/audioHelper';

interface BalanceModalProps {
  open: boolean;
  onClose: () => void;
}

const BalanceModal: React.FC<BalanceModalProps> = ({ open, onClose }) => {
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundClient, setFoundClient] = useState<Client | null>(null);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError('Por favor ingresa un ID único');
      setFoundClient(null);
      return;
    }
    audioHelper.playClickCategory();
    setIsSearching(true);
    setError('');
    setFoundClient(null);

    const client = await getClientByUniqueId(searchId);
    setIsSearching(false);

    if (client) {
      setFoundClient(client);
      setError('');
    } else {
      setFoundClient(null);
      setError('Cliente no encontrado. Verifica el ID ingresado.');
    }
  };

  const handleClose = () => {
    setSearchId('');
    setError('');
    setIsSearching(false);
    setFoundClient(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay-saldo" style={{ 
      display: 'flex',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="modal-box-saldo" style={{ 
        maxWidth: '400px',
        width: '90%',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div className="modal-header-saldo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="Logo_StoreNetos_V2.png" alt="Logo" style={{ height: 32 }} />
            <span className="modal-title-saldo" style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', margin: 0 }}>STORE NETOS</span>
          </div>
          <span className="close-btn-saldo" onClick={handleClose} style={{ color: 'var(--danger)', fontSize: 28, lineHeight: '20px', cursor: 'pointer' }}>&times;</span>
        </div>
        <div className="modal-body-saldo">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#666' }}>ID Único del Cliente:</label>
            <input
              type="text"
              placeholder="Ej: CLI01"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ background: '#f8d7da', color: 'var(--danger-dark)', padding: 12, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {foundClient && (
            <div style={{ background: '#d4edda', color: 'var(--success-dark)', padding: 16, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{foundClient.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {foundClient.id}</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(21, 87, 36, 0.2)', paddingTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Departamento:</span>
                  <strong>{foundClient.department}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Saldo:</span>
                  <strong style={{ fontSize: 18, color: 'var(--success-dark)' }}>${foundClient.balance.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              width: '100%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '16px',
              cursor: isSearching ? 'wait' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 12px rgba(107, 63, 181, 0.3)',
              transition: 'all 0.2s ease',
              opacity: isSearching ? 0.7 : 1
            }}
            onMouseEnter={(e) => !isSearching && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isSearching ? '⏳ BUSCANDO...' : '🔍 BUSCAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceModal;
