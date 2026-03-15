import React, { useState } from 'react';
import { Product, Client, getClientByUniqueId } from '../../services/storeService';
import { audioHelper } from '../../utils/audioHelper';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSidebarProps {
  items: CartItem[];
  onAdd: (product: Product) => void;
  onRemove: (product: Product) => void;
  total: number;
  onPay?: (client: Client, paymentType: 'efectivo' | 'credito') => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ items, onAdd, onRemove, total, onPay }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'efectivo' | 'credito' | ''>('');

  const handlePayNow = () => {
    setShowPayment(true);
    setPaymentType('');
    audioHelper.playClickCategory();
  };

  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [showBankTransfer, setShowBankTransfer] = useState(false);

  const isFormComplete = foundClient && paymentType;

  const handleAddClientById = async () => {
    const id = searchId.trim();
    if (!id) {
      setSearchError('Ingresa un ID válido');
      audioHelper.playError();
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setFoundClient(null);

    const c = await getClientByUniqueId(id);
    setIsSearching(false);

    if (!c) {
      setFoundClient(null);
      setSearchError('Cliente no encontrado');
      audioHelper.playError();
      return;
    }
    // Cliente encontrado
    setFoundClient(c);
    setSearchError('');
    // Si saldo inicial es 0, preselecciona crédito (regla del negocio)
    if (c.balance === 0) {
      setPaymentType('credito');
    }
    audioHelper.playClickCategory();
  };

  const handleConfirmPayment = () => {
    if (!foundClient || !paymentType) return;

    // Aplicar reglas de saldo
    if (paymentType === 'credito') {
      // Incrementa únicamente el saldo con compras a crédito
      foundClient.balance = Number((foundClient.balance + total).toFixed(2));
      foundClient.totalPurchase = Number((foundClient.totalPurchase + total).toFixed(2));
      foundClient.lastUpdate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    }
    // Si es efectivo, no se modifica el saldo

    // Ejecutar pago (callback) y reproducir sonido
    if (onPay) onPay(foundClient, paymentType as 'efectivo' | 'credito');
    audioHelper.playPaymentSuccess();

    // Limpiar estado
    setShowPayment(false);
    setFoundClient(null);
    setSearchId('');
    setPaymentType('');
    setShowBankTransfer(false);
  };

  if (showPayment) {
    return (
      <div className="cart-horizontal">
        {/* Área izquierda: Resumen */}
        <div className="cart-items-container">
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => { setShowPayment(false); audioHelper.playClickCategory(); }}
              style={{
                background: 'var(--danger)',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '16px',
                transition: 'all 0.3s ease',
                marginBottom: 16
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ← Volver al carrito
            </button>
            <h2 style={{ color: 'var(--text-main)', margin: '20px 0 0 0', fontSize: '24px' }}>📋 Resumen de la Orden</h2>
          </div>

          <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #ddd', marginBottom: '12px', fontSize: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>x{quantity} @ ${product.price.toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '16px' }}>${(product.price * quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid #ddd', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Área derecha: Pago (buscar por ID) */}
        <div className="cart-summary-panel">
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '12px' }}>💳 Módulo de Pago</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.95)' }}>ID Único del Cliente:</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Ej: SN2026010603"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '2px solid var(--danger)', fontWeight: 700 }}
              />
              <button
                onClick={handleAddClientById}
                disabled={isSearching}
                style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: '2px solid var(--primary-dark)', fontWeight: 700 }}
              >
                {isSearching ? 'Buscando...' : 'Agregar'}
              </button>
            </div>
            {searchError && !isSearching && <div style={{ marginTop: 8, color: '#ffe6e6', background: 'rgba(255,23,68,0.1)', padding: 8, borderRadius: 6 }}>{searchError}</div>}
          </div>

          {foundClient && (
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '8px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{foundClient.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>ID: {foundClient.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Departamento</div>
                  <div style={{ fontWeight: 800 }}>{foundClient.department}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#fff', opacity: 0.95 }}>Saldo actual</div>
                <div style={{ fontWeight: 900, color: 'var(--success)', fontSize: 18 }}>${foundClient.balance.toFixed(2)}</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.95)' }}>Tipo de pago:</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={"payment-option" + (paymentType === 'efectivo' ? ' active' : '')}
                disabled={!foundClient}
                onClick={() => { if (foundClient) { setPaymentType('efectivo'); audioHelper.playClickCategory(); } }}
                onMouseEnter={(e) => (e.currentTarget.classList.add('hovered'))}
                onMouseLeave={(e) => (e.currentTarget.classList.remove('hovered'))}
                style={{ flex: 1 }}
              >
                💵 Efectivo
              </button>
              <button
                className={"payment-option" + (paymentType === 'credito' ? ' active' : '')}
                disabled={!foundClient}
                onClick={() => { if (foundClient) { setPaymentType('credito'); audioHelper.playClickCategory(); } }}
                onMouseEnter={(e) => (e.currentTarget.classList.add('hovered'))}
                onMouseLeave={(e) => (e.currentTarget.classList.remove('hovered'))}
                style={{ flex: 1 }}
              >
                💳 Crédito
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => { setShowBankTransfer(s => !s); audioHelper.playClickCategory(); }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '2px solid rgba(255,255,255,0.06)', fontWeight: 700 }}
            >
              DATOS TRANSFERENCIA
            </button>
          </div>

          {showBankTransfer && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, color: '#fff', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>BBVA BANCOMER</div>
              <div>CLABE Interbancaria: 012691015136309915</div>
              <div>Titular: Ing.Ernesto Baeza</div>
            </div>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={!isFormComplete}
            style={{
              width: '100%',
              padding: '14px',
              background: isFormComplete ? 'var(--success)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '2px solid ' + (isFormComplete ? 'var(--success-dark)' : 'rgba(255,255,255,0.08)'),
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '16px',
              cursor: isFormComplete ? 'pointer' : 'not-allowed',
              opacity: isFormComplete ? 1 : 0.6,
              transition: 'all 0.3s ease',
              marginTop: 'auto'
            }}
          >
            ✅ COBRAR & FINALIZAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-horizontal">
      {/* Área izquierda: Productos */}
      <div className="cart-items-container">
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '24px' }}>🛒 Tu Carrito</h2>
        {items.length === 0 ? (
          <div className="cart-empty">
            <div style={{ fontSize: '48px', marginBottom: 12 }}>📭</div>
            <h3 style={{ color: 'var(--text-light)' }}>El carrito está vacío</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Agrega productos para comenzar</p>
          </div>
        ) : (
          <div>
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item-row">
                {product.image && <img src={product.image} alt={product.name} className="cart-item-image" />}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>{product.name}</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Precio unit: ${product.price.toFixed(2)}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>
                    Subtotal: ${(product.price * quantity).toFixed(2)}
                  </div>
                </div>
                <div className="cart-item-controls">
                  <button 
                    className="cart-qty-btn" 
                    onClick={() => { onRemove(product); audioHelper.playClickCategory(); }}
                    aria-label={`Disminuir cantidad de ${product.name}`}
                  >
                    −
                  </button>
                  <div className="cart-qty-display">{quantity}</div>
                  <button 
                    className="cart-qty-btn" 
                    onClick={() => { onAdd(product); audioHelper.playAddToCart(); }}
                    aria-label={`Aumentar cantidad de ${product.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Área derecha: Resumen y pago */}
      <div className="cart-summary-panel">
        <div style={{ marginBottom: 'auto' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '12px' }}>📊 Resumen</h3>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: 16, backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '14px' }}>
              <span>Productos:</span>
              <strong>{items.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '14px' }}>
              <span>Cantidad:</span>
              <strong>{items.reduce((sum, item) => sum + item.quantity, 0)} unidades</strong>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700 }}>
              <span>TOTAL:</span>
              <span style={{ color: 'var(--success)' }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayNow}
          disabled={items.length === 0}
          style={{
            width: '100%',
            padding: '14px',
            background: items.length === 0 ? 'rgba(255,255,255,0.2)' : 'var(--danger)',
            color: '#fff',
            border: '2px solid ' + (items.length === 0 ? 'rgba(255,255,255,0.2)' : 'var(--danger-dark)'),
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '16px',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            opacity: items.length === 0 ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => items.length === 0 ? null : (e.currentTarget.style.transform = 'translateY(-3px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          🔴 PROCEDER AL PAGO
        </button>
      </div>
    </div>
  );
};

export default CartSidebar;
