import React, { useState, useEffect, useMemo } from 'react';
import Header from '../ui/layout/Header';
import SidebarCategories from '../ui/layout/SidebarCategories';
import MainCatalog from '../ui/layout/MainCatalog';
import CartSidebar from '../ui/layout/CartSidebar';
import Toast from '../components/Toast';
import Footer from '../ui/layout/Footer';
import { products } from '../mock/products';
import { clients } from '../mock/clients';

const categories = [
  { id: 'ALL', name: 'Todas' },
  { id: 'GAL01', name: 'GALLETAS' },
  { id: 'SAB01', name: 'SABRITAS' },
  { id: 'CAC01', name: 'CACAHUATES' },
  { id: 'CHI01', name: 'CHICLES' },
  { id: 'CHOC01', name: 'CHOCOLATES' },
  { id: 'DUL01', name: 'DULCES' },
  { id: 'CAF01', name: 'CAFÉS' },
  { id: 'BEB01', name: 'BEBIDAS' },
];

const StoreNetosApp: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [sortType, setSortType] = useState<string>('');
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('storeNetosCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }

    // Initialize inventory with random values on first load
    const savedInventory = localStorage.getItem('storeNetosInventory');
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (e) {
        console.error('Failed to load inventory:', e);
        initializeInventory();
      }
    } else {
      initializeInventory();
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('storeNetosCart', JSON.stringify(cart));
  }, [cart]);

  // Initialize inventory with random stock values
  const initializeInventory = () => {
    const newInventory = products.reduce((acc, p) => ({
      ...acc,
      [p.id]: Math.floor(Math.random() * 80) + 20 // Random 20-100
    }), {});
    setInventory(newInventory);
    localStorage.setItem('storeNetosInventory', JSON.stringify(newInventory));
  };

  // Filtrar productos por categoría
  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedCategory === 'ALL' || p.categoryId === selectedCategory);
  }, [selectedCategory]);

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortType === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortType === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortType === 'alpha') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filteredProducts, sortType]);

  // Carrito con detalles de producto
  const cartItems = cart.map(item => ({
    product: products.find(p => p.id === item.productId)!,
    quantity: item.quantity
  })).filter(item => item.product);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Handlers
  const handleAddToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const found = prev.find(i => i.productId === product.id);
      if (found) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
    // Show toast notification
    setToast({ message: `✅ ${product.name} agregado al carrito`, type: 'success' });
  };

  const handleRemoveFromCart = (product: typeof products[0]) => {
    setCart(prev => {
      const found = prev.find(i => i.productId === product.id);
      if (found && found.quantity > 1) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.productId !== product.id);
    });
  };

  const handlePay = (clientId: string, paymentType: 'efectivo' | 'credito') => {
    // Simular pago y limpiar carrito
    const client = clients.find(c => c.id === clientId);
    const summary = `Pago de $${total.toFixed(2)} realizado para ${client?.name || 'cliente'} (${paymentType === 'efectivo' ? 'Efectivo' : 'Crédito'})`;
    setToast({ message: `✅ ${summary}`, type: 'success' });
    setCart([]);
  };

  return (
    <div>
      {/* Global CSS Variables Injection */}
      <style>{`
        :root {
          --primary: #6b3fb5;
          --primary-dark: #5a2d96;
          --success: #4caf50;
          --success-dark: #45a049;
          --danger: #ff1744;
          --danger-dark: #d50000;
          --text-main: #333333;
          --text-light: #888888;
          --bg-light: #f5f7fa;
          --shadow-card: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
      <Header 
        cartItems={cartItems}
        onOpenCart={() => setShowCartPanel(true)}
        showCartButton={true}
        clients={clients}
      />
      <div className="main-container">
        <SidebarCategories
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="catalog-section">
          <MainCatalog
            products={sortedProducts}
            onAddToCart={handleAddToCart}
            layout="vertical"
            onSort={setSortType}
            inventory={inventory}
          />
        </div>
      </div>

      {/* Cart full-screen panel / drawer */}
      {showCartPanel && (
        <div className="cart-panel-overlay" onClick={() => setShowCartPanel(false)}>
          <div className="cart-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="Logo_StoreNetos_V2.png" alt="Logo" style={{ height: 32 }} />
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>STORE NETOS</span>
              </div>
              <button onClick={() => setShowCartPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 28, cursor: 'pointer', padding: 0, lineHeight: '20px' }}>&times;</button>
            </div>
            <CartSidebar
              items={cartItems}
              onAdd={handleAddToCart}
              onRemove={handleRemoveFromCart}
              total={total}
              clients={clients}
              onPay={handlePay}
            />
            <div className="cart-panel-bottom">
              <button className="add-more" onClick={() => setShowCartPanel(false)}>Agregar más productos</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Footer />
    </div>
  );
};

export default StoreNetosApp;
