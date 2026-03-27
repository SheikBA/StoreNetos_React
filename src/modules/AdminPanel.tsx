import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  getProducts, Product, updateAdminPassword, addProduct, updateProduct, deleteProduct, 
  getOrders, Order, getClients, Client, updateClient, deleteClient, addClient, 
  registerClientPayment, getCategories, Category, addCategory, updateCategory, 
  deleteCategory, getFriendlyErrorMessage 
} from '../services/storeService';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'categories' | 'wallet' | 'security'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [passForm, setPassForm] = useState({ username: 'Vladislav', newPass: '' });
  const [passMsg, setPassMsg] = useState('');

  const [topClientsLimit, setTopClientsLimit] = useState(5);
  const [topClientsSegment, setTopClientsSegment] = useState<'all' | 'credito' | 'efectivo'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    internalId: '', name: '', description: '', category: '', unit: 'pz', price: 0, stock: 0, image: '', isBlocked: false
  });

  const [selectedClientWallet, setSelectedClientWallet] = useState<Client | null>(null);
  const [walletSearchTerm, setWalletSearchTerm] = useState('');
  const [walletSort, setWalletSort] = useState<{ key: keyof Client; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFormData, setClientFormData] = useState<Omit<Client, 'id'>>({
    name: '', uniqueId: '', balance: 0, department: '', totalPurchase: 0, payment: 0, lastUpdate: '', email: '', isBlocked: false
  });
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Omit<Category, 'id'>>({ name: '', internalId: '' });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadReport, setUploadReport] = useState<{row: number, name: string, status: 'success' | 'error', message: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleWalletSort = (key: keyof Client) => {
    setWalletSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, clientsData, categoriesData] = await Promise.all([
        getProducts(),
        getOrders(),
        getClients(),
        getCategories()
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setClients(clientsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error cargando datos del panel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.newPass) return;
    
    setPassMsg('Cargando & Procesando...');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadReport([]);

    const totalTime = 6000;
    const intervalTime = 100;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setUploadProgress(progress);

      if (currentStep >= steps) {
        clearInterval(timer);
        processExcelFile(file);
      }
    }, intervalTime);
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const report: { row: number; name: string; status: 'success' | 'error'; message: string }[] = [];
      
      const existingProductNames = new Set(products.map(p => (p.name || '').toLowerCase().trim()));
      const existingInternalIds = new Set(products.map(p => (p.internalId || '').toString().trim().toUpperCase()));
      const validCategoryNames = new Set(categories.map(c => (c.name || '').toUpperCase().trim()));
      const validCategoryIds = new Set(categories.map(c => (c.id || '').toUpperCase().trim()));

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;
        
        const internalId = row['ID'] || row['CODIGO'] || row['SKU'] || row['INTERNAL_ID'] || row['ID interno'];
        const name = row['Nombre'] || row['nombre'] || row['NAME'];
        const price = row['Precio'] || row['precio'] || row['PRICE'];
        const category = row['Categoria'] || row['categoria']  || row['categories'] || row['CATEGORY'];
        const stock = row['Stock'] || row['stock'] || row['Inventario'] || row['STOCK'];
        
        if (!name || !internalId || !price || !category || stock === undefined) {
          report.push({ row: rowNum, name: name || 'Desconocido', status: 'error' as const, message: 'Faltan campos obligatorios' });
          continue;
        }

        if (internalId && existingInternalIds.has(String(internalId).toUpperCase().trim())) {
          report.push({ row: rowNum, name: `${name} (ID: ${internalId})`, status: 'error' as const, message: 'ID Interno/SKU ya existe' });
          continue;
        }

        if (!internalId && existingProductNames.has(String(name).toLowerCase().trim())) {
          report.push({ row: rowNum, name: name, status: 'error' as const, message: 'Producto duplicado (ya existe)' });
          continue;
        }

        const catUpper = String(category).toUpperCase().trim();
        if (!validCategoryNames.has(catUpper) && !validCategoryIds.has(catUpper)) {
          report.push({ row: rowNum, name: name, status: 'error' as const, message: `Categoría "${category}" no existe en Firebase` });
          continue;
        }
        try {
          await addProduct({
            internalId: String(internalId).trim(),
            name: String(name).trim(),
            description: row['Descripcion'] || '',
            category: catUpper,
            unit: row['Unidad'] || 'pz',
            price: Number(price),
            stock: Number(stock),         
            isBlocked: false,           
            image: row['Imagen'] || '',
          });
          report.push({ row: rowNum, name: name, status: 'success' as const, message: 'Registrado exitosamente' });
        } catch (error) {
          report.push({ row: rowNum, name: name, status: 'error' as const, message: 'Error interno de Firebase' });
        }
      }

      setUploadReport(report);
      setIsUploading(false);
      loadData();
    };
    reader.readAsBinaryString(file);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '', internalId: '', price: 0, category: 'GALLETAS', image: '', stock: 0, unit: 'pz', description: '', isBlocked: false
    });
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, internalId: product.internalId || '', price: product.price, category: product.category, image: product.image, stock: product.stock, unit: product.unit, description: product.description || '', isBlocked: product.isBlocked || false
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto permanentemente?')) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (products.length === 0) {
      alert("El inventario ya está vacío.");
      return;
    }

    if (window.confirm(`⚠️ ¡PELIGRO! ⚠️\n\nEstás a punto de ELIMINAR TODOS los ${products.length} productos del inventario.\n\n¿Estás seguro de que deseas continuar?`)) {
      if (window.confirm("CONFIRMACIÓN FINAL:\n\nEsta acción no se puede deshacer. ¿Realmente quieres borrar todo?")) {
        setLoading(true);
        try {
          const deletePromises = products.map(p => deleteProduct(p.id));
          await Promise.all(deletePromises);
          alert("✅ Todos los productos han sido eliminados correctamente.");
          loadData();
        } catch (error) {
          console.error("Error en eliminación masiva:", error);
          alert("❌ Ocurrió un error al intentar eliminar algunos productos.");
          loadData();
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleExportToExcel = () => {
    if (products.length === 0) {
      alert("No hay productos para exportar.");
      return;
    }

    const dataToExport = products.map(p => ({
      'ID Firebase': p.id, 'ID Interno (SKU)': p.internalId || '', 'Nombre': p.name, 'Precio': p.price, 'Categoría': p.category, 'Stock': p.stock, 'Unidad': p.unit, 'URL Imagen': p.image, 'Descripción': p.description || '', 'Bloqueado': p.isBlocked ? 'SI' : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Inventario_StoreNetos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleToggleBlock = async (product: Product) => {
    const newStatus = !product.isBlocked;
    await updateProduct({ ...product, isBlocked: newStatus });
    loadData();
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
      alert(getFriendlyErrorMessage(error));
    }
  };

  const handleAddNewClient = () => {
    setEditingClient(null);
    setClientFormData({
      name: '', uniqueId: '', balance: 0, department: '', totalPurchase: 0, payment: 0, lastUpdate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'), email: '', isBlocked: false
    });
    setIsClientFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name, uniqueId: client.uniqueId, balance: client.balance, department: client.department, totalPurchase: client.totalPurchase, payment: client.payment, lastUpdate: client.lastUpdate, email: client.email || '', isBlocked: client.isBlocked || false
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
      } else {
        await addClient(clientFormData);
      }
      setIsClientFormOpen(false);
      loadData();
    } catch (error) { 
      console.error(error); 
      alert(getFriendlyErrorMessage(error)); 
    }
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
      
      const updatedClient = { ...selectedClientWallet, balance: selectedClientWallet.balance - amount };
      setSelectedClientWallet(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
    } catch (error) {
      console.error(error);
      alert(getFriendlyErrorMessage(error));
    }
  };

  const handleAddNewCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', internalId: '' });
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name, internalId: cat.internalId || '' });
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      await deleteCategory(id);
      loadData();
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({ ...categoryFormData, id: editingCategory.id });
      } else {
        await addCategory(categoryFormData);
      }
      setIsCategoryFormOpen(false);
      loadData();
    } catch (error) {
      console.error("Error guardando categoría:", error);
      alert(getFriendlyErrorMessage(error));
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(product.internalId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(cat => 
    (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && cat.id !== 'ALL'
  );

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  const totalRevenueEfectivo = orders
    .filter(o => o.paymentType === 'efectivo')
    .reduce((sum, order) => sum + order.total, 0);
  const totalRevenueCredito = orders
    .filter(o => o.paymentType === 'credito')
    .reduce((sum, order) => sum + order.total, 0);

  const topClients = useMemo(() => {
    const filteredOrders = topClientsSegment === 'all'
        ? orders
        : orders.filter(o => o.paymentType === topClientsSegment);

    const clientPurchases = filteredOrders.reduce((acc, order) => {
        if (order.clientId) {
            acc[order.clientId] = (acc[order.clientId] || 0) + order.total;
        }
        return acc;
    }, {} as Record<string, number>);

    const sortedClientIds = Object.keys(clientPurchases).sort((a, b) => clientPurchases[b] - clientPurchases[a]);

    return sortedClientIds.slice(0, topClientsLimit).map(clientId => ({
        id: clientId,
        name: clients.find(c => c.id === clientId)?.name || 'Cliente Desconocido',
        total: clientPurchases[clientId]
    }));
  }, [orders, clients, topClientsLimit, topClientsSegment]);

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

  const uniqueIdCounts = clients.reduce((acc, client) => {
    if (client.uniqueId) {
      acc[client.uniqueId] = (acc[client.uniqueId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const duplicateUniqueIds = new Set(
    Object.keys(uniqueIdCounts).filter(id => uniqueIdCounts[id] > 1)
  );

  const filteredClients = clients
    .filter(c => c.name.toLowerCase().includes(walletSearchTerm.toLowerCase()) || c.uniqueId.toLowerCase().includes(walletSearchTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a[walletSort.key] ?? '';
      const valB = b[walletSort.key] ?? '';
      if (valA < valB) return walletSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return walletSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const clientCreditOrders = selectedClientWallet 
    ? orders.filter(o => o.clientId === selectedClientWallet.id && o.paymentType === 'credito').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
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
              <button onClick={() => setActiveView('categories')} style={{ width: '100%', textAlign: 'left', padding: '10px', background: activeView === 'categories' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                🏷️ Categorías
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
          onClick={() => navigate('/Store')}
          style={{ padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </button>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {activeView === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ margin: 0, color: '#333' }}>Dashboard de Negocio</h1>
              <button onClick={loadData} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔄 Actualizar
              </button>
            </div>
            {loading ? <p>Cargando estadísticas...</p> :
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#666', fontSize: '16px' }}>💰 Ingresos por Venta</h3>
                    <div style={{ fontSize: '14px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Efectivo:</span> <strong>${totalRevenueEfectivo.toFixed(2)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Crédito:</span> <strong>${totalRevenueCredito.toFixed(2)}</strong></div>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px' }}>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total:</span>
                        <span>${totalRevenue.toFixed(2)}</span>
                      </p>
                    </div>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ marginTop: 0, color: '#666' }}>🏆 Top Clientes por Compra</h3>
                        <div style={{ display: 'flex', gap: '5px', background: '#eee', padding: '4px', borderRadius: '6px' }}>
                            {[5, 10, 20].map(limit => (
                                <button
                                    key={limit}
                                    onClick={() => setTopClientsLimit(limit)}
                                    style={{
                                        padding: '4px 8px', border: 'none', borderRadius: '4px', background: topClientsLimit === limit ? '#6b3fb5' : 'transparent', color: topClientsLimit === limit ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Top {limit}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                        {(['all', 'credito', 'efectivo'] as const).map(segment => (
                            <button
                                key={segment}
                                onClick={() => setTopClientsSegment(segment)}
                                style={{
                                    padding: '6px 12px', border: topClientsSegment === segment ? '2px solid #3498db' : '2px solid #ddd', borderRadius: '15px', background: topClientsSegment === segment ? '#eaf5fc' : 'white', color: topClientsSegment === segment ? '#2980b9' : '#555', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize'
                                }}
                            >
                                {segment === 'all' ? 'Todos' : segment}
                            </button>
                        ))}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {topClients.length > 0 ? topClients.map((c, i) => (
                            <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <span>{i + 1}. {c.name}</span>
                                <span style={{ fontWeight: 'bold' }}>${c.total.toFixed(2)}</span>
                            </li>
                        )) : <p style={{color: '#999', textAlign: 'center'}}>No hay datos de compra para este segmento.</p>}
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAddNew} style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Nuevo</button>
                <button onClick={handleExportToExcel} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>↓ Exportar</button>
                <button onClick={handleBulkDelete} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>🗑️ Eliminar Productos</button>
                <button onClick={() => setIsBulkModalOpen(true)} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>↑ Carga Masiva</button>
              </div>
            </div>
            {loading ? (
              <p>Cargando inventario...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '15px', color: '#666', fontSize: '12px', minWidth: '150px' }}>ID Producto</th>
                      <th style={{ padding: '15px', color: '#666', fontSize: '12px' }}>ID Interno</th>
                      <th style={{ padding: '15px', color: '#666' }}>Imagen</th>
                      <th style={{ padding: '15px', color: '#666' }}>Nombre</th>
                      <th style={{ padding: '15px', color: '#666' }}>Cat. Asignada</th>
                      <th style={{ padding: '15px', color: '#666' }}>Cat. Sistema</th>
                      <th style={{ padding: '15px', color: '#666' }}>Precio</th>
                      <th style={{ padding: '15px', color: '#666' }}>Stock</th>
                      <th style={{ padding: '15px', color: '#666' }}>Estado</th>
                      <th style={{ padding: '15px', color: '#666' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const prodCatVal = (product.category || '').trim();
                      
                      const matchedCategory = categories.find(c => 
                        c.id === prodCatVal || 
                        (c.name || '').toUpperCase() === prodCatVal.toUpperCase()
                      );

                      const isConsistent = !!matchedCategory;
                      const rowBg = !isConsistent 
                        ? '#ffebee'
                        : product.isBlocked ? '#f9f9f9' : 'white';

                      return (
                      <tr key={product.id} style={{ borderBottom: '1px solid #eee', opacity: product.isBlocked ? 0.5 : 1, backgroundColor: rowBg }}>
                        <td style={{ padding: '10px 15px', fontSize: '10px', color: '#888', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {product.id}
                        </td>
                        <td style={{ padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', color: '#555', fontFamily: 'monospace' }}>
                          {product.internalId || <span style={{color:'#ccc', fontStyle: 'italic'}}>-</span>}
                        </td>
                      <td style={{ padding: '10px 15px' }}>
                        <img 
                          src={product.image || 'https://via.placeholder.com/40'} 
                          alt={product.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 15px', fontWeight: '600' }}>{product.name}</td>

                      <td style={{ padding: '10px 15px' }}>
                        <span style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                          {product.category}
                        </span>
                      </td>

                      <td style={{ padding: '10px 15px', minWidth: '120px' }}>
                        {matchedCategory ? (
                          <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>✅ {matchedCategory.name}</span>
                        ) : (
                          <span style={{ color: '#c0392b', fontWeight: 'bold', fontSize: '12px' }}>⚠️ NO EXISTE</span>
                        )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeView === 'categories' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
              <h1 style={{ margin: 0, color: '#333', flexShrink: 0 }}>Gestión de Categorías</h1>
              <input type="text" placeholder="Buscar categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '10px', width: '100%', maxWidth: '400px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAddNewCategory} style={{ padding: '10px 20px', background: '#6b3fb5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Nueva</button>
              </div>
            </div>
            {loading ? (
              <p>Cargando categorías...</p>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '15px', color: '#666', fontSize: '12px' }}>ID</th>
                      <th style={{ padding: '15px', color: '#666' }}>ID Interno</th>
                      <th style={{ padding: '15px', color: '#666' }}>Nombre de Categoría</th>
                      <th style={{ padding: '15px', color: '#666' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 15px', fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>{cat.id}</td>
                        <td style={{ padding: '10px 15px', fontWeight: 'bold', fontFamily: 'monospace' }}>{cat.internalId || <span style={{color: '#ccc'}}>-</span>}</td>
                        <td style={{ padding: '10px 15px', fontWeight: '600' }}>{cat.name}</td>
                        <td style={{ padding: '10px 15px' }}>
                          <button onClick={() => handleEditCategory(cat)} title="Editar" style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                          <button onClick={() => handleDeleteCategory(cat.id)} title="Eliminar" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {isFormOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ marginTop: 0 }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <form onSubmit={handleSubmitProduct}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>ID Interno / SKU (Opcional)</label>
                     <input type="text" value={formData.internalId || ''} onChange={e => setFormData({...formData, internalId: e.target.value})} placeholder="Ej. A-001" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nombre</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
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
                    {categories.filter(c => c.id !== 'ALL').map(cat => (
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
