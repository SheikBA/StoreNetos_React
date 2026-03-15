import React, { useState } from 'react';
import { Product } from '../../services/storeService';
import { audioHelper } from '../../utils/audioHelper';

interface MainCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  layout: 'vertical' | 'horizontal';
  onSort: (type: string) => void;
  inventory?: { [key: string]: number };
}

const MainCatalog: React.FC<MainCatalogProps> = ({ products, onAddToCart, layout, onSort, inventory = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p =>
    p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Catálogo de Productos</h2>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px',
            minWidth: '150px'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => { onSort('price-asc'); audioHelper.playClickCategory(); }} aria-label="Ordenar por precio ascendente" style={{ padding: '6px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Precio ↑</button>
          <button onClick={() => { onSort('price-desc'); audioHelper.playClickCategory(); }} aria-label="Ordenar por precio descendente" style={{ padding: '6px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Precio ↓</button>
          <button onClick={() => { onSort('alpha'); audioHelper.playClickCategory(); }} aria-label="Ordenar alfabéticamente" style={{ padding: '6px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>A-Z</button>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 24
      }}>
        {filteredProducts.length > 0 ? filteredProducts.map(product => {
          const stock = inventory[product.id] ?? 0;
          const isOutOfStock = stock === 0;
          return (
            <div key={product.id} className="product-card" style={{ 
              minWidth: 220, 
              maxWidth: 260, 
              background: 'white', 
              borderRadius: 20, 
              boxShadow: 'var(--shadow-card)', 
              padding: 16, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative',
              opacity: isOutOfStock ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}>
              {isOutOfStock && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  SIN STOCK
                </div>
              )}
              {product.image && <img src={product.image} alt={product.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16, marginBottom: 12 }} />}
              <div style={{ width: '100%' }}>
                <h4 style={{ margin: '8px 0 4px 0', fontWeight: 700 }}>{product.name}</h4>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>${product.price.toFixed(2)}</div>
                <div className={isOutOfStock ? 'stock-alert' : ''} style={{ fontSize: 13, color: stock > 0 ? 'var(--success)' : 'var(--danger)', marginBottom: 8, fontWeight: 700 }}>
                  📦 Stock: {stock}
                </div>
                <button className="add-btn" onClick={() => { onAddToCart(product); audioHelper.playAddToCart(); }} disabled={isOutOfStock} aria-label={`Agregar ${product.name} al carrito`} style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}>
                  {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
            No se encontraron productos
          </div>
        )}
      </div>
    </section>
  );
};

export default MainCatalog;
