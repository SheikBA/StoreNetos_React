import React, { useEffect, useState } from 'react';
import { getProducts, Product, updateAdminPassword, addProduct, updateProduct, deleteProduct, getOrders, Order, getClients, Client, updateClient, deleteClient, addClient, registerClientPayment } from '../services/storeService';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'wallet' | 'security'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para la sección de seguridad
  const [passForm, setPassForm] = useState({ username: 'Vladislav', newPass: '' });
  const [passMsg, setPassMsg] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estado para el detalle de cartera
  const [selectedClientWallet, setSelectedClientWallet] = useState<Client | null>(null);
  const [walletSearchTerm, setWalletSearchTerm] = useState('');
  const [walletSort, setWalletSort] = useState<{ key: keyof Client; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  // Estado para formulario de cliente
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFormData, setClientFormData] = useState<Omit<Client, 'id'>>({
    name: '', uniqueId: '', balance: 0, department: '', totalPurchase: 0, payment: 0, lastUpdate: '', email: '', isBlocked: false
  });

  // Helper para ordenamiento
  const handleWalletSort = (key: keyof Client) => {
    setWalletSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    category: 'GALLETAS',
    image: '',
    stock: 0,
    unit: 'pz',
    description: '',
    isBlocked: false
  });

  const CATEGORIES = [
    { id: 'GAL01', name: 'GALLETAS' },
    { id: 'SAB01', name: 'SABRITAS' },
    { id: 'CAC01', name: 'CACAHUATES' },
    { id: 'CHI01', name: 'CHICLES' },
    { id: 'CHOC01', name: 'CHOCOLATES' },
    { id: 'DUL01', name: 'DULCES' },
    { id: 'CAF01', name: 'CAFÉS' },
    { id: 'BEB01', name: 'BEBIDAS' },
  ];


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, clientsData] = await Promise.all([
        getProducts(),
        getOrders(),
        getClients()
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setClients(clientsData);
    } catch (error) {
      console.error("Error cargando datos del panel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.newPass) return;
    
    setPassMsg('Procesando...');
    try {
      const success = await updateAdminPassword(passForm.username, passForm.newPass);
      if (success) {
        setPassMsg('✅ Contraseña actualizada correctamente (Hash seguro).');
        setPassForm(prev => ({ ...prev, newPass: '' }));
      } else {
        setPassMsg('❌ Error: Usuario no encontrado.');
      }
    } catch (error) {
      console.error(error);
      setPassMsg('❌ Error al actualizar.');
    }
  };

  // --- Handlers de Productos ---

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: 0,
      category: 'GALLETAS',
      image: '',
      stock: 0,
      unit: 'pz',
      description: '',
      isBlocked: false
    });
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock,
      unit: product.unit,
      description: product.description || '',
      isBlocked: product.isBlocked || false
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto permanentemente?')) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleToggleBlock = async (product: Product) => {
    const newStatus = !product.isBlocked;
    await updateProduct({ ...product, isBlocked: newStatus });
    loadData(); // Recargar para ver cambios
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct({ ...formData, id: editingProduct.id });
      } else {
        await addProduct(formData);
      }
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("Error al guardar el producto");
    }
  };

  // --- Handlers de Clientes ---
  const handleAddNewClient = () => {
    setEditingClient(null);
    setClientFormData({
      name: '',
      uniqueId: '',
      balance: 0,
      department: '',
      totalPurchase: 0,
      payment: 0,
      lastUpdate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
      email: '',
      isBlocked: false
    });
    setIsClientFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      uniqueId: client.uniqueId,
      balance: client.balance,
      department: client.department,
      totalPurchase: client.totalPurchase,
      payment: client.payment,
      lastUpdate: client.lastUpdate,
      email: client.email || '',
      isBlocked: client.isBlocked || false
    });
    setIsClientFormOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente y todo su historial?')) {
      await deleteClient(id);
      loadData();
    }
  };

  const handleToggleBlockClient = async (client: Client) => {
    await updateClient({ ...client, isBlocked: !client.isBlocked });
    loadData();
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient({ ...clientFormData, id: editingClient.id });
        setIsClientFormOpen(false);
        loadData();
      }
    } catch (error) { console.error(error); alert("Error al guardar cliente"); }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientWallet) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0");
      return;
    }

    if (amount > selectedClientWallet.balance) {
      if (!window.confirm("El monto es mayor al saldo actual. ¿Deseas continuar y dejar saldo a favor (negativo)?")) {
        return;
      }
    }

    try {
      await registerClientPayment(selectedClientWallet.id, amount);
      
      // Actualizar vista localmente para feedback instantáneo
      const updatedClient = { ...selectedClientWallet, balance: selectedClientWallet.balance - amount };
      setSelectedClientWallet(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
    } catch (error) {
      console.error(error);
      alert("❌ Error al registrar el pago");
    }
  };

  // --- Filtrado de productos ---
  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Dashboard Calculations ---
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productSales: { [key: string]: { name: string, quantity: number } } = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (productSales[item.id]) {
        productSales[item.id].quantity += item.qty;
      } else {
        productSales[item.id] = { name: item.name, quantity: item.qty };
      }
    });
  });

  const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const soldProductIds = new Set(Object.keys(productSales));
  const lowRotationProducts = products
    .filter(p => !soldProductIds.has(p.id) && p.stock > 0)
    .slice(0, 5);

  const salesByDay: { [key: string]: number } = orders.reduce((acc, order) => {
    const date = new Date(order.date).toLocaleDateString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' });
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += order.total;
    return acc;
  }, {} as { [key: string]: number });

  // --- Detección de Clientes Duplicados ---
  const uniqueIdCounts = clients.reduce((acc, client) => {
    if (client.uniqueId) {
      acc[client.uniqueId] = (acc[client.uniqueId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const duplicateUniqueIds = new Set(
    Object.keys(uniqueIdCounts).filter(id => uniqueIdCounts[id] > 1)
  );

  // --- Filtrado y Ordenamiento de Clientes ---
  const filteredClients = clients
    .filter(c => c.name.toLowerCase().includes(walletSearchTerm.toLowerCase()) || c.uniqueId.toLowerCase().includes(walletSearchTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a[walletSort.key] ?? '';
      const valB = b[walletSort.key] ?? '';
      if (valA < valB) return walletSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return walletSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // --- Wallet Logic ---
  // Filtrar órdenes del cliente seleccionado que sean a crédito (para ver el detalle de la deuda)
  const clientCreditOrders = selectedClientWallet 
    ? orders.filter(o => o.clientId === selectedClientWallet.id && o.paymentType === 'credito').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Sidebar simple */}
      <aside style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 30px 0', fontSize: '24px' }}>Admin Panel</h2>
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <button onClick={() => setActiveView('dashboard')} style={{ width: '100%', textAlign: 'left', padding: '10px', background: activeView === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                📊 Dashboard
              </button>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <button onClick={() => setActiveView('products')} style={{ width: '100%', textAlign: 'left', padding: '10px', background: activeView === 'products' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                📦 Productos
              </button>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <button onClick={() => setActiveView('wallet')} style={{ width: '100%', textAlign: 'left', padding: '10px', background: activeView === 'wallet' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                💳 Cartera
              </button>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <button onClick={() => setActiveView('security')} style={{ width: '100%', textAlign: 'left', padding: '10px', background: activeView === 'security' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                🔐 Seguridad
              </button>
            </li>
          </ul>
        </nav>
        <button 
          onClick={onLogout}
          style={{ padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </button>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {activeView === 'dashboard' && (
          <div>
            <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Dashboard de Negocio</h1>
            {loading ? <p>Cargando estadísticas...</p> :
              <div>
                {/* Fila de Métricas Principales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666', fontSize: '16px' }}>💰 Ingresos Totales</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60', margin: 0 }}>${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666', fontSize: '16px' }}>📈 Órdenes Totales</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db', margin: 0 }}>{totalOrders}</p>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666', fontSize: '16px' }}>🛒 Valor Promedio Orden</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22', margin: 0 }}>${averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Fila de Análisis de Productos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>🏆 Top 5 Productos Vendidos</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {topSellingProducts.map((p, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>{p.name}</span>
                          <span style={{ fontWeight: 'bold' }}>{p.quantity} uds.</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>📉 Productos con Baja Rotación (Con Stock)</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {lowRotationProducts.length > 0 ? lowRotationProducts.map((p) => (
                        <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>{p.name}</span>
                          <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{p.stock} en stock</span>
                        </li>
                      )) : <p style={{color: '#999'}}>¡Todos los productos con stock se han vendido al menos una vez!</p>}
                    </ul>
                  </div>
                </div>

                {/* Gráfico de Líneas */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                  <h3 style={{ marginTop: 0, color: '#666' }}>Evolución de Ingresos Diarios</h3>
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Gráfico no disponible (Librerías no instaladas)</p>
                </div>
              </div>
            }
          </div>
        )}

        {activeView === 'wallet' && (
          <div>
            <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Cartera de Clientes</h1>
            
            {!selectedClientWallet && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="🔍 Buscar cliente por nombre o ID..." 
                  value={walletSearchTerm}
                  onChange={e => setWalletSearchTerm(e.target.value)}
                  style={{ padding: '10px', width: '100%', maxWidth: '400px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <button 
                  onClick={handleAddNewClient} 
                  style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Nuevo Cliente
                </button>
              </div>
            )}
            
            {!selectedClientWallet ? (
              // Vista General: Lista de Clientes
              <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                    <tr style={{ cursor: 'pointer' }}>
                      <th onClick={() => handleWalletSort('name')} style={{ padding: '15px', color: '#666' }}>Nombre {walletSort.key === 'name' && (walletSort.direction === 'asc' ? '↑' : '↓')}</th>
                      <th onClick={() => handleWalletSort('uniqueId')} style={{ padding: '15px', color: '#666' }}>ID Único {walletSort.key === 'uniqueId' && (walletSort.direction === 'asc' ? '↑' : '↓')}</th>
                      <th onClick={() => handleWalletSort('department')} style={{ padding: '15px', color: '#666' }}>Departamento {walletSort.key === 'department' && (walletSort.direction === 'asc' ? '↑' : '↓')}</th>
                      <th onClick={() => handleWalletSort('balance')} style={{ padding: '15px', color: '#666' }}>Saldo Vencido {walletSort.key === 'balance' && (walletSort.direction === 'asc' ? '↑' : '↓')}</th>
                      <th style={{ padding: '15px', color: '#666' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(client => {
                      const isDuplicate = duplicateUniqueIds.has(client.uniqueId);
                      return (
                      <tr key={client.id} style={{ 
                        borderBottom: '1px solid #eee', 
                        opacity: client.isBlocked ? 0.5 : 1, 
                        backgroundColor: isDuplicate ? '#fff2f2' : (client.isBlocked ? '#f9f9f9' : 'white'),
                        borderLeft: isDuplicate ? '4px solid #e74c3c' : 'none'
                      }}>
                        <td style={{ padding: '15px', fontWeight: '600' }}>{client.name}</td>
                        <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>{client.uniqueId}</td>
                        <td style={{ padding: '15px' }}>{client.department}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ 
                            color: client.balance > 0 ? '#e74c3c' : '#27ae60', 
                            fontWeight: 'bold',
                            background: client.balance > 0 ? '#fcebea' : '#eafaf1',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            ${client.balance.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <button onClick={() => setSelectedClientWallet(client)} title="Ver Detalle" style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            👁️
                          </button>
                          <button onClick={() => handleEditClient(client)} title="Editar" style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            ✏️
                          </button>
                          <button onClick={() => handleToggleBlockClient(client)} title={client.isBlocked ? "Desbloquear" : "Bloquear"} style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            {client.isBlocked ? '🔓' : '🔒'}
                          </button>
                          <button onClick={() => handleDeleteClient(client.id)} title="Eliminar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // Vista Detalle: Historial del Cliente
              <div>
                <button onClick={() => setSelectedClientWallet(null)} style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ← Volver a la lista
                </button>
                
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #6b3fb5', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{selectedClientWallet.name}</h2>
                  <div style={{ display: 'flex', gap: '30px', color: '#666', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div><strong>ID:</strong> {selectedClientWallet.uniqueId}</div>
                    <div><strong>Depto:</strong> {selectedClientWallet.department}</div>
                    <div><strong>Saldo Total:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>${selectedClientWallet.balance.toFixed(2)}</span></div>
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      style={{ marginLeft: 'auto', padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💵 Registrar Abono
                    </button>
                  </div>
                </div>

                <h3 style={{ color: '#555' }}>Historial de Compras a Crédito</h3>
                {clientCreditOrders.length > 0 ? (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {clientCreditOrders.map(order => (
                      <div key={order.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>📅 {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString()}</span>
                          <span style={{ fontWeight: 'bold', color: '#6b3fb5' }}>Total: ${order.total.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• {item.name} (x{item.qty})</span>
                              <span>${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Este cliente no tiene compras registradas a crédito.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal de Edición de Cliente */}
        {isClientFormOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ marginTop: 0 }}>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <form onSubmit={handleSubmitClient}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Nombre</label>
                  <input required type="text" value={clientFormData.name} onChange={e => setClientFormData({...clientFormData, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>ID Único</label>
                  <input required type="text" value={clientFormData.uniqueId} onChange={e => setClientFormData({...clientFormData, uniqueId: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Departamento</label>
                  <input required type="text" value={clientFormData.department} onChange={e => setClientFormData({...clientFormData, department: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Email (Opcional)</label>
                  <input type="email" value={clientFormData.email} onChange={e => setClientFormData({...clientFormData, email: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsClientFormOpen(false)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Abono */}
        {isPaymentModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0, color: '#27ae60' }}>Registrar Abono</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>Cliente: <strong>{selectedClientWallet?.name}</strong></p>
              <p style={{ color: '#666', fontSize: '14px' }}>Saldo Actual: <strong>${selectedClientWallet?.balance.toFixed(2)}</strong></p>
              
              <form onSubmit={handleRegisterPayment}>
                <div style={{ marginBottom: '20px', marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Monto a abonar ($)</label>
                  <input autoFocus required type="number" step="0.01" min="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #27ae60', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold' }} placeholder="0.00" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Pago</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeView === 'security' && (
          <div style={{ maxWidth: '500px', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>Actualizar Contraseña Admin</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Esta acción guardará la contraseña de forma segura (encriptada) en Firebase.
            </p>
            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Usuario</label>
                <input type="text" value={passForm.username} onChange={e => setPassForm({...passForm, username: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Nueva Contraseña</label>
                <input type="password" value={passForm.newPass} onChange={e => setPassForm({...passForm, newPass: e.target.value})} placeholder="Ingresa la nueva contraseña" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              <button type="submit" style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Actualizar Contraseña</button>
              {passMsg && <p style={{ marginTop: '15px', fontWeight: 'bold', color: passMsg.includes('Error') ? '#e74c3c' : '#27ae60' }}>{passMsg}</p>}
            </form>
          </div>
        )}

        {activeView === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
              <h1 style={{ margin: 0, color: '#333', flexShrink: 0 }}>Gestión de Productos</h1>
              <input type="text" placeholder="Buscar por nombre o categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '100%', maxWidth: '400px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <button onClick={handleAddNew} style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Nuevo Producto</button>
            </div>
            {loading ? <p>Cargando inventario...</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <tr>
                  <th style={{ padding: '15px', color: '#666' }}>Imagen</th>
                  <th style={{ padding: '15px', color: '#666' }}>Nombre</th>
                  <th style={{ padding: '15px', color: '#666' }}>Categoría</th>
                  <th style={{ padding: '15px', color: '#666' }}>Precio</th>
                  <th style={{ padding: '15px', color: '#666' }}>Stock</th>
                  <th style={{ padding: '15px', color: '#666' }}>Estado</th>
                  <th style={{ padding: '15px', color: '#666' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #eee', opacity: product.isBlocked ? 0.5 : 1, backgroundColor: product.isBlocked ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '10px 15px' }}>
                      <img 
                        src={product.image || 'https://via.placeholder.com/40'} 
                        alt={product.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '10px 15px', fontWeight: '600' }}>{product.name}</td>
                    <td style={{ padding: '10px 15px' }}>
                      <span style={{ padding: '4px 8px', background: '#eee', borderRadius: '12px', fontSize: '12px' }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px' }}>${product.price.toFixed(2)}</td>
                    <td style={{ padding: '10px 15px' }}>
                      <span style={{ 
                        color: product.stock < 5 ? '#e74c3c' : '#27ae60',
                        fontWeight: 'bold'
                      }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      {product.isBlocked ? (
                        <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '12px', border: '1px solid #e74c3c', padding: '2px 6px', borderRadius: '4px' }}>BLOQUEADO</span>
                      ) : (
                        <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>ACTIVO</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <button onClick={() => handleEdit(product)} title="Editar" style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                      <button onClick={() => handleToggleBlock(product)} title={product.isBlocked ? "Desbloquear" : "Bloquear"} style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>
                        {product.isBlocked ? '🔓' : '🔒'}
                      </button>
                      <button onClick={() => handleDelete(product.id)} title="Eliminar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            }
          </>
        )}

        {/* Modal de Formulario */}
        {isFormOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ marginTop: 0 }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <form onSubmit={handleSubmitProduct}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Precio</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>URL Imagen</label>
                  <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Descripción</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;