import React, { useState } from 'react';
import { Client } from '../../mock/clients';
import { Product } from '../../mock/products';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onPay: (clientId: string, paymentType: 'efectivo' | 'credito') => void;
  clients: Client[];
  cartItems: CartItem[];
  total: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, onPay, clients, cartItems, total }) => {
  const [clientId, setClientId] = useState('');
  const [paymentType, setPaymentType] = useState<'efectivo' | 'credito' | ''>('');

  const client = clients.find(c => c.id === clientId);
  const isFormComplete = clientId && paymentType;

  if (!open) return null;
  return (
    <div className="modal-overlay-saldo" style={{ display: 'flex' }}>
      <div className="modal-box-saldo" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header-saldo">
          <span className="modal-title-saldo">Módulo de Pago</span>
          <span className="close-btn-saldo" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body-saldo">
          {/* Resumen de la orden */}
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Resumen de la Orden</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #ddd' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>x{quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#6b3fb5' }}>${(product.price * quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid #ddd', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#6b3fb5' }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Formulario de pago */}
          <div className="data-row-saldo">
            <span className="data-label">Cliente:</span>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: '60%' }}>
              <option value="">Selecciona...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.department})</option>
              ))}
            </select>
          </div>
          {client && (
            <>
              <div className="data-row-saldo">
                <span className="data-label">ID único:</span>
                <span className="data-value">{client.id}</span>
              </div>
              <div className="data-row-saldo">
                <span className="data-label">Saldo disponible:</span>
                <span className="data-value">${client.balance.toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ margin: '18px 0 10px 0', display: 'flex', gap: 12 }}>
            <button
              id="btn-finalizar"
              style={{ background: paymentType === 'efectivo' ? 'var(--verde-frescura)' : '#e0e0e0', color: paymentType === 'efectivo' ? 'white' : '#888' }}
              disabled={!clientId}
              onClick={() => setPaymentType('efectivo')}
            >
              Pagar en efectivo
            </button>
            <button
              id="btn-finalizar"
              style={{ background: paymentType === 'credito' ? 'var(--morado-primario)' : '#e0e0e0', color: paymentType === 'credito' ? 'white' : '#888' }}
              disabled={!clientId}
              onClick={() => setPaymentType('credito')}
            >
              Pagar a crédito
            </button>
          </div>
          <button
            id="checkout-button"
            style={{ marginTop: 10 }}
            disabled={!isFormComplete}
            onClick={() => clientId && paymentType && onPay(clientId, paymentType as 'efectivo' | 'credito')}
          >
            <span></span><span></span><span></span><span></span>
            COBRAR Y FINALIZAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
