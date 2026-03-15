import React, { useState, useEffect, useMemo } from 'react';
import Header from '../ui/layout/Header';
import SidebarCategories from '../ui/layout/SidebarCategories';
import MainCatalog from '../ui/layout/MainCatalog';
import CartSidebar from '../ui/layout/CartSidebar';
import Toast from '../components/Toast';
import Footer from '../ui/layout/Footer';
import { listenToProducts, processOrderAndDecreaseStock, Product, Client } from '../services/storeService';
import LoginPage from './LoginPage';
import AdminPanel from './AdminPanel';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [sortType, setSortType] = useState<string>('');
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [view, setView] = useState<'store' | 'login' | 'admin'>('store');

  // Cargar datos iniciales y establecer listener en tiempo real para productos
  useEffect(() => {
    // 1. Cargar carrito desde localStorage (solo una vez)
    const savedCart = localStorage.getItem('storeNetosCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // 2. Establecer listener para productos en tiempo real
    const unsubscribe = listenToProducts((productsData) => {
      setProducts(productsData);
      
      // 3. Sincronizar el inventario cada vez que los productos cambian
      const newInventory = productsData.reduce((acc: Record<string, number>, p: Product) => ({
        ...acc,
        [p.id]: p.stock || 0
      }), {} as Record<string, number>);
      setInventory(newInventory);
      localStorage.setItem('storeNetosInventory', JSON.stringify(newInventory));
    });

    // 4. Función de limpieza para detener el listener cuando el componente se desmonte
    return () => {
      unsubscribe();
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('storeNetosCart', JSON.stringify(cart));
  }, [cart]);

  // Nota: initializeInventory se ha movido al useEffect de carga de datos

  // Filtrar productos por categoría
  const filteredProducts = useMemo(() => {
    // Nota: Asegúrate que en Firebase el campo se llame 'category' y coincida con los IDs (ej. GAL01)
    return products.filter(p => selectedCategory === 'ALL' || p.category === selectedCategory);
  }, [selectedCategory, products]);

  // Calcular categorías visibles (solo las que tienen productos + 'ALL')
  const visibleCategories = useMemo(() => {
    const activeCategoryIds = new Set(products.map(p => p.category));
    return categories.filter(cat => cat.id === 'ALL' || activeCategoryIds.has(cat.id));
  }, [products]);

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortType === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortType === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortType === 'alpha') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return sorted;
  }, [filteredProducts, sortType]);

  // Carrito con detalles de producto
  const cartItems = cart.map(item => ({
    product: products.find(p => p.id === item.productId) || null,
    quantity: item.quantity
  })).filter(item => item.product !== null) as { product: Product; quantity: number }[];

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Handlers
  const handleAddToCart = (product: Product) => {
    if (product.isBlocked) {
      setToast({ message: '⛔ Este producto no está disponible para la venta actualmente, Necesitas quitarlo de tú carrito.', type: 'error' });
      return;
    }

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

  const handleRemoveFromCart = (product: Product) => {
    setCart(prev => {
      const found = prev.find(i => i.productId === product.id);
      if (found && found.quantity > 1) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.productId !== product.id);
    });
  };

  const handlePay = async (client: Client, paymentType: 'efectivo' | 'credito') => {
    // Validación de seguridad: Verificar si hay productos bloqueados en el carrito antes de pagar
    const blockedItems = cartItems.filter(item => item.product.isBlocked);
    
    if (blockedItems.length > 0) {
      const itemNames = blockedItems.map(i => i.product.name).join(', ');
      setToast({ message: `⛔ No se puede procesar: ${itemNames} ya no está disponible. Elimínalo del carrito.`, type: 'error' });
      // Opcional: Podrías abrir el carrito automáticamente para que lo vean
      setShowCartPanel(true);
      return;
    }

    // Crear objeto de orden
    const orderData = {
      clientId: client.id,
      clientName: client.name,
      items: cartItems.map(i => ({ id: i.product.id, name: i.product.name, qty: i.quantity, price: i.product.price })),
      total,
      paymentType,
      date: new Date().toISOString()
    };

    const itemsToUpdate = cartItems.map(i => ({
      id: i.product.id,
      quantity: i.quantity,
    }));

    try {
      // La nueva función se encarga de crear la orden y descontar el stock atómicamente
      await processOrderAndDecreaseStock(orderData, itemsToUpdate);

      // Si la transacción es exitosa, actualizamos el inventario local
      setInventory(prevInventory => {
        const newInventory = { ...prevInventory };
        itemsToUpdate.forEach(item => {
          newInventory[item.id] = (newInventory[item.id] || 0) - item.quantity;
        });
        // Guardamos el nuevo inventario en localStorage para persistencia
        localStorage.setItem('storeNetosInventory', JSON.stringify(newInventory));
        return newInventory;
      });

      const summary = `Pago de $${total.toFixed(2)} registrado para ${client.name}`;
      setToast({ message: `✅ ¡Orden completada! ${summary}`, type: 'success' });
      setCart([]);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      // Mostramos el error específico que viene desde la transacción (ej. falta de stock)
      const errorMessage = typeof error === 'string' ? error : '❌ No se pudo procesar la orden.';
      setToast({
        message: errorMessage,
        type: 'error'
      });
    }
  };

  if (view === 'login') {
    return (
      <LoginPage 
        onBack={() => setView('store')} 
        onLoginSuccess={() => {
          setToast({ message: '¡Bienvenido Administrador!', type: 'success' });
          setView('admin'); // Aquí cambiarías a tu vista de AdminPanel cuando la crees
        }} 
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel onLogout={() => setView('store')} />
    );
  }

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
        onAdminClick={() => setView('login')}
      />
      <div className="main-container">
        <SidebarCategories
          categories={visibleCategories}
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
              onPay={handlePay}
              onNotify={(message, type) => setToast({ message, type })}
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
