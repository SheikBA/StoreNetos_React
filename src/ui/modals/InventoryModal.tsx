import React from 'react';
import { Product } from '../../services/storeService';

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSyncInventory: () => void;
  products: Product[];
  inventory: { [key: string]: number };
}

const InventoryModal: React.FC<InventoryModalProps> = ({ open, onClose, products, inventory }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay-saldo" style={{ display: 'flex' }}>
      <div className="modal-box-saldo" style={{ maxHeight: '80vh', overflowY: 'auto', minWidth: '500px' }}>
        <div className="modal-header-saldo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="Logo_StoreNetos_V2.png" alt="Logo" style={{ height: 32 }} />
            <span className="modal-title-saldo" style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', margin: 0 }}>STORE NETOS</span>
          </div>
          <span className="close-btn-saldo" onClick={onClose} style={{ color: 'var(--danger)', fontSize: 28, lineHeight: '20px', cursor: 'pointer' }}>&times;</span>
        </div>
        <div className="modal-body-saldo">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, color: '#333' }}>Producto</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: '#333' }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>ID: {product.id}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-block',
                      background: inventory[product.id] > 0 ? '#d4edda' : '#f8d7da',
                      color: inventory[product.id] > 0 ? '#155724' : '#721c24',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {inventory[product.id] ?? 0} unidades
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
