import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../ui/layout/Header';
import SidebarCategories from '../ui/layout/SidebarCategories';
import MainCatalog from '../ui/layout/MainCatalog';
import CartSidebar from '../ui/layout/CartSidebar';
import Footer from '../ui/layout/Footer';
import { listenToProducts, listenToCategories, processOrderAndDecreaseStock, Product, Client, Category, getFriendlyErrorMessage } from '../services/storeService';

const StoreNetosApp: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState<Category[]>([{ id: 'ALL', name: 'Todas' }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [sortType, setSortType] = useState<string>('');
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hideNoStock, setHideNoStock] = useState(false); // Estado para ocultar agotados

  // Ref para el contenedor del mensaje (toast)
  const toastRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

    // 3. Establecer listener para categorías
    const unsubscribeCategories = listenToCategories((cats) => {
      setCategories([{ id: 'ALL', name: 'Todas' }, ...cats]);
    });

    // 4. Función de limpieza
    return () => {
      unsubscribe();
      unsubscribeCategories();
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('storeNetosCart', JSON.stringify(cart));
  }, [cart]);

  // Efecto para manejar el cierre automático de notificaciones
  useEffect(() => {
    // Función que se ejecuta al hacer clic en cualquier parte del documento
    const handleClickOutside = (event: MouseEvent) => {
      // Si el mensaje existe y el clic fue FUERA de él, se cierra.
      if (toastRef.current && !toastRef.current.contains(event.target as Node)) {
        setToast(null);
      }
    };

    // Si hay un mensaje visible, se añade el "escuchador" de clics.
    if (toast) {
      // Se usa un timeout para evitar que el mismo clic que abre el mensaje lo cierre inmediatamente.
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }

    // Función de limpieza: se elimina el "escuchador" cuando el mensaje se cierra.
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [toast]); // Este efecto se ejecuta cada vez que el estado del mensaje cambia.


  // Nota: initializeInventory se ha movido al useEffect de carga de datos

  // Filtrar productos por categoría
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;

    // Obtener datos de la categoría seleccionada para comparar flexiblemente (por ID o Nombre)
    const currentCat = categories.find(c => c.id === selectedCategory);
    const targetId = String(selectedCategory).trim().toUpperCase();
    const targetName = currentCat ? String(currentCat.name || '').trim().toUpperCase() : '';

    return products.filter(p => {
      const pCat = String(p.category || '').trim().toUpperCase();
      return pCat === targetId || (targetName !== '' && pCat === targetName);
    });
  }, [selectedCategory, products, categories]);

  // Calcular categorías visibles (solo las que tienen productos + 'ALL')
  const visibleCategories = useMemo(() => {
    const activeCategoryIds = new Set(products.map(p => String(p.category || '').trim().toUpperCase()));
    return categories.filter(cat => {
      if (cat.id === 'ALL') return true;
      const cId = String(cat.id).trim().toUpperCase();
      const cName = String(cat.name || '').trim().toUpperCase();
      return activeCategoryIds.has(cId) || activeCategoryIds.has(cName);
    });
  }, [products, categories]);

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];

    // Filtrar por stock si la opción está activa
    if (hideNoStock) {
      sorted = sorted.filter(p => (inventory[p.id] ?? p.stock) > 0);
    }

    if (sortType === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortType === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortType === 'alpha') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return sorted;
  }, [filteredProducts, sortType, hideNoStock, inventory]);

  // Carrito con detalles de producto
  const cartItems = cart.map(item => ({
    product: products.find(p => p.id === item.productId) || null,
    quantity: item.quantity
  })).filter(item => item.product !== null) as { product: Product; quantity: number }[];

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Handlers
  const handleAddToCart = (product: Product) => {
    if (product.isBlocked) {
      setToast({ message: '⛔ Este producto no está disponible para la venta actualmente. Necesitas quitarlo de tu carrito.', type: 'error' });
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
      // La función ahora devuelve la URL de WhatsApp o null
      const whatsappUrl = await processOrderAndDecreaseStock(orderData, itemsToUpdate);

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
      setToast({
        message: `✅ ¡Orden completada! ${summary}`,
        type: 'success'
      });
      setCart([]);

      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      const err = error as any;
      console.error("Error al procesar el pago:", err);
      setToast({
        // Usamos la función centralizada para traducir errores
        message: getFriendlyErrorMessage(err),
        type: 'error'
      });
    }
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
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <Header 
        cartItems={cartItems}
        onOpenCart={() => setShowCartPanel(true)}
        showCartButton={true}
      />
      <div className="main-container">
        <SidebarCategories
          categories={visibleCategories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <div className="catalog-section">
          {/* Barra de herramientas del catálogo */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', padding: '0 10px' }}>
            <button 
              onClick={() => setHideNoStock(!hideNoStock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: hideNoStock ? '1px solid #4caf50' : '1px solid #ddd',
                background: hideNoStock ? '#e8f5e9' : 'white',
                color: hideNoStock ? '#2e7d32' : '#666',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
              title={hideNoStock ? "Clic para ver todos los productos" : "Clic para ver solo productos con stock"}
            >
              {hideNoStock ? '👁️ Mostrar Agotados' : '🚫 Ocultar Agotados'}
            </button>
          </div>

          <MainCatalog
            products={sortedProducts}
            categories={categories}
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
        <div
          ref={toastRef} // Asignamos la referencia al contenedor
          style={{
            position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white', // 1. Fondo del contenedor: Blanco
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          zIndex: 9999,
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out',
          borderLeft: `5px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}` // Indicador visual de color
          }}
        >
          {/* 2. Icono intuitivo para el tipo de mensaje */}
          <span style={{ fontSize: '24px' }}>{toast.type === 'error' ? '❌' : '✅'}</span>
          
          {/* 3. Mensaje con color de letra dinámico */}
          <span style={{
            fontSize: '14px',
            lineHeight: '1.5',
            flex: 1,
            color: toast.type === 'error' ? 'var(--danger-dark)' : 'var(--text-main)'
          }}>
            {toast.message}
          </span>
          
          {/* 4. Botón de cierre con tacha roja */}
          <button 
            onClick={() => setToast(null)}
            title="Cerrar"
            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '28px', cursor: 'pointer', padding: '0', lineHeight: '1', opacity: 0.6 }}
          >
            &times;
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default StoreNetosApp;
