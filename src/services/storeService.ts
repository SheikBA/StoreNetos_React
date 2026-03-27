import { collection, getDocs, writeBatch, doc, runTransaction, getDoc, updateDoc, addDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import bcrypt from 'bcryptjs';
import { sendOrderEmail } from "./emailService";
import { createWhatsAppNotificationUrl } from './whatsappService';

// Definimos la estructura de nuestros datos
export interface Product {
  id: string; // Firestore usa strings para IDs
  internalId?: string; // ID Interno / SKU
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  unit: string;
  description?: string;
  isBlocked?: boolean; // Nuevo campo para bloqueo
}

export interface Category {
  id: string;
  name: string;
  internalId?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: { id: string; name: string; qty: number; price: number }[];
  total: number;
  paymentType: 'efectivo' | 'credito';
  date: string; // ISO Date string
  status?: 'Exitoso' | 'Fallido';
}

export interface Client {
  id: string;
  name: string;
  uniqueId: string;
  balance: number;
  department: string;
  totalPurchase: number;
  payment: number;
  lastUpdate: string;
  email?: string;
  isBlocked?: boolean;
}

// --- DIAGNÓSTICO: Confirmar que el servicio se cargó correctamente ---
console.log("✅ storeService.ts cargado correctamente. Las funciones de base de datos están listas.");

// --- FUNCIONES API ---

// 1. Obtener todos los productos
export const getProducts = async (): Promise<Product[]> => {
  const querySnapshot = await getDocs(collection(db, "products"));
  // Mapeamos los documentos de Firestore a nuestro formato
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
};

// Escuchar productos en tiempo real
export const listenToProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, "products"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    callback(products);
  }, (error) => {
    console.error("Error listening to products collection: ", error);
  });
  return unsubscribe; // Devuelve la función para cancelar la suscripción
};

// 1.1 Obtener todas las categorías
export const getCategories = async (): Promise<Category[]> => {
  const querySnapshot = await getDocs(collection(db, "categories"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

// Escuchar categorías en tiempo real (Punto 4 aplicado a Categorías)
export const listenToCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(db, "categories"));
  return onSnapshot(q, (querySnapshot) => {
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    callback(categories);
  }, (error) => {
    console.error("Error listening to categories: ", error);
  });
};

// Obtener todas las órdenes para el dashboard
export const getOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, "orders"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Order));
};

// 2.1 Obtener todos los clientes (Para el panel de administración)
export const getClients = async (): Promise<Client[]> => {
  const querySnapshot = await getDocs(collection(db, "clients"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Client));
};

// 2. Obtener un cliente por su ID único
export const getClientByUniqueId = async (uniqueId: string): Promise<Client | null> => {
  // Corregido: Buscar por el campo 'uniqueId' en lugar del ID del documento.
  const q = query(collection(db, "clients"), where("uniqueId", "==", uniqueId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.error(`No se encontró cliente con el ID único: ${uniqueId}.`);
    return null;
  }

  // Advertencia si se encuentran duplicados, pero se procede con el primero.
  if (querySnapshot.size > 1) {
    console.warn(`Se encontraron ${querySnapshot.size} clientes duplicados con el ID único: ${uniqueId}. Se usará el primero.`);
  }

  const clientDoc = querySnapshot.docs[0];
  return { id: clientDoc.id, ...clientDoc.data() } as Client;
};

// 3. Procesar Orden y Descontar Stock (Transacción Atómica)
export const processOrderAndDecreaseStock = async (orderData: any, items: { id: string, quantity: number }[]): Promise<string | null> => {
  try {
    // La transacción ahora devolverá los datos para el correo, o null si no son necesarios.
    const emailNotificationData = await runTransaction(db, async (transaction) => {
      // --- 1. FASE DE LECTURA ---
      // Obtenemos todos los documentos de productos y el del cliente en paralelo.
      const productRefs = items.map(item => doc(db, "products", item.id));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
      
      let clientDoc = null;
      let clientRef = null;
      if (orderData.clientId) {
        clientRef = doc(db, "clients", orderData.clientId);
        clientDoc = await transaction.get(clientRef);
      }

      // --- 2. FASE DE VALIDACIÓN Y PREPARACIÓN ---
      // Ahora que todas las lecturas están hechas, procesamos los datos.
      const updates: { ref: any, data: any }[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const productDoc = productDocs[i];

        if (!productDoc.exists()) {
          throw `El producto con ID ${item.id} no existe y no se puede completar la orden.`;
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw `No hay suficiente stock para "${productDoc.data().name}". Disponible: ${currentStock}, Solicitado: ${item.quantity}.`;
        }
        // Preparamos la actualización del stock pero aún no la ejecutamos.
        updates.push({ ref: productRefs[i], data: { stock: newStock } });
      }

      let previousBalance = 0;
      let newBalance = 0;
      let clientData: Client | null = null;

      if (clientDoc && clientDoc.exists()) {
        clientData = { id: clientDoc.id, ...clientDoc.data() } as Client;
        previousBalance = clientData.balance || 0;
        newBalance = previousBalance; // Por defecto, el saldo no cambia (para ventas de contado)

        if (orderData.paymentType === 'credito' && clientRef) {
          const currentTotalPurchase = clientData.totalPurchase || 0;
          newBalance = Number((previousBalance + orderData.total).toFixed(2));
          
          // Preparamos la actualización del cliente.
          updates.push({
            ref: clientRef,
            data: {
              balance: newBalance,
              totalPurchase: Number((currentTotalPurchase + orderData.total).toFixed(2)),
              lastUpdate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
            }
          });
        }
      }

      // --- 3. FASE DE ESCRITURA ---
      // Todas las lecturas y validaciones están completas. Ahora, ejecutamos todas las escrituras.
      updates.forEach(u => transaction.update(u.ref, u.data));

      // Creamos el documento de la orden.
      const orderRef = doc(collection(db, "orders"));
      const finalOrderData = { ...orderData, status: 'Exitoso' as const };
      transaction.set(orderRef, finalOrderData);

      // --- 4. FASE DE RETORNO ---
      if (clientData) {
        return {
          order: { ...finalOrderData, id: orderRef.id } as Order,
          client: clientData,
          prevBalance: previousBalance,
          newBalance: newBalance
        };
      }

      return null; // Si no hay datos de cliente, no hay nada que devolver.
    });
    
    // Transacción exitosa. Ahora sí, enviamos el correo (Fire and Forget)
    if (emailNotificationData) {
      // Obtenemos los emails aquí para evitar la dependencia circular en emailService
      const adminEmails = await getAdminEmails();
      sendOrderEmail(
        emailNotificationData.order,
        emailNotificationData.client,
        emailNotificationData.prevBalance,
        emailNotificationData.newBalance,
        adminEmails // <--- Pasamos los emails explícitamente
      );

      // Crea y devuelve la URL de WhatsApp para que la UI la maneje
      return createWhatsAppNotificationUrl(emailNotificationData.order, emailNotificationData.client);
    }

    return null; // No hay URL si no hay datos de notificación

  } catch (e) {
    console.error("Error en la transacción de la orden:", e);
    throw e;
  }
};

// 7. CRUD de Productos para el Panel de Administración

// Agregar producto
export const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "products"), product);
    return docRef.id;
  } catch (e) {
    console.error("Error al agregar el producto:", e);
    throw e;
  }
};

// Actualizar producto (incluye bloqueo/desbloqueo si se pasa el campo isBlocked)
export const updateProduct = async (product: Product) => {
  try {
    const productRef = doc(db, "products", product.id);
    const { id, ...data } = product; // Separamos el ID para no guardarlo dentro del documento
    await updateDoc(productRef, data);
  } catch (e) {
    console.error("Error al actualizar el producto:", e);
    throw e;
  }
};

// Alternar estado de bloqueo de producto (Función dedicada)
export const toggleProductBlock = async (id: string, currentStatus: boolean) => {
  try {
    const productRef = doc(db, "products", id);
    // Si currentStatus es undefined, asumimos false, así que lo invertimos a true
    const newStatus = !currentStatus;
    await updateDoc(productRef, { isBlocked: newStatus });
  } catch (e) {
    console.error("Error al cambiar el estado de bloqueo del producto:", e);
    throw e;
  }
};

// Eliminar producto
export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (e) {
    console.error("Error al eliminar el producto:", e);
    throw e;
  }
};

// --- CRUD de Categorías ---

// Agregar categoría
export const addCategory = async (category: Omit<Category, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "categories"), category);
    return docRef.id;
  } catch (e) {
    console.error("Error al agregar la categoría:", e);
    throw e;
  }
};

// Actualizar categoría
export const updateCategory = async (category: Category) => {
  try {
    const categoryRef = doc(db, "categories", category.id);
    const { id, ...data } = category;
    await updateDoc(categoryRef, data);
  } catch (e) {
    console.error("Error al actualizar la categoría:", e);
    throw e;
  }
};

// Eliminar categoría
export const deleteCategory = async (id: string) => {
  try {
    await deleteDoc(doc(db, "categories", id));
  } catch (e) {
    console.error("Error al eliminar la categoría:", e);
    throw e;
  }
};








// --- CRUD de Clientes ---

// Agregar cliente
export const addClient = async (client: Omit<Client, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "clients"), client);
    return docRef.id;
  } catch (e) {
    console.error("Error al agregar el cliente:", e);
    throw e;
  }
};

// Actualizar cliente
export const updateClient = async (client: Client) => {
  try {
    const clientRef = doc(db, "clients", client.id);
    const { id, ...data } = client;
    await updateDoc(clientRef, data);
  } catch (e) {
    console.error("Error al actualizar el cliente:", e);
    throw e;
  }
};

// Eliminar cliente
export const deleteClient = async (id: string) => {
  try {
    await deleteDoc(doc(db, "clients", id));
  } catch (e) {
    console.error("Error al eliminar el cliente:", e);
    throw e;
  }
};

// Registrar Abono de Cliente
export const registerClientPayment = async (clientId: string, amount: number) => {
  try {
    await runTransaction(db, async (transaction) => {
      const clientRef = doc(db, "clients", clientId);
      const clientDoc = await transaction.get(clientRef);

      if (!clientDoc.exists()) {
        throw "El cliente no existe.";
      }

      const currentBalance = clientDoc.data().balance || 0;
      const newBalance = currentBalance - amount;

      transaction.update(clientRef, {
        balance: Number(newBalance.toFixed(2)),
        lastUpdate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
      });
    });
  } catch (e) {
    console.error("Error al registrar el pago:", e);
    throw e;
  }
};

// 8. Obtener correos de administradores
export const getAdminEmails = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "adminemail"));
    // Asumimos que los documentos tienen un campo llamado "email"
    return querySnapshot.docs.map(doc => doc.data().email).filter(email => !!email);
  } catch (e) {
    console.error("Error al obtener los correos de administrador:", e);
    return []; // Retorna arreglo vacío si falla para no romper el flujo
  }
};

// --- UTILS: Manejo de Errores ---
export const getFriendlyErrorMessage = (error: any): string => {
  // 1. Si es un string simple (errores manuales)
  if (typeof error === 'string') return error;

  // 2. Errores de Firebase (objetos con código)
  if (error && error.code) {
    switch (error.code) {
      case 'permission-denied':
        return '⛔ Permiso denegado: No tienes autorización para realizar esta operación (ej. ventas a crédito sin privilegios).';
      case 'unavailable':
        return '📡 Sin conexión: No se pudo conectar con el servidor. Verifica tu internet.';
      case 'not-found':
        return '🔍 Datos no encontrados: El registro que intentas consultar no existe.';
      case 'resource-exhausted':
        return '⚠️ Cuota excedida: El servicio está saturado temporalmente.';
      case 'already-exists':
        return '⚠️ Duplicado: El registro ya existe en el sistema.';
      case 'unauthenticated':
        return '🔒 No autenticado: Debes iniciar sesión nuevamente.';
      default:
        return `❌ Error del sistema (${error.code}): ${error.message}`;
    }
  }

  // 3. Errores genéricos
  if (error && error.message) {
    return `❌ Error: ${error.message}`;
  }

  return '❌ Ocurrió un error desconocido al procesar la solicitud.';
};

// 4. Migración de Datos (Seed)
export const seedDatabase = async (products: any[], clients: any[] = []) => {
  console.log(`🚀 Intentando iniciar carga masiva. Productos recibidos: ${products?.length || 0}`);
  
  if (!Array.isArray(products) || products.length === 0) {
    console.error("❌ Error en seedDatabase: La lista de productos es indefinida o vacía.");
    throw new Error("El archivo no contiene una lista válida de productos.");
  }

  // CHUNKING: Dividimos los datos en lotes de 450 para respetar el límite de 500 de Firebase
  const BATCH_SIZE = 450;
  let processedCount = 0;
  
  // --- PROCESAR PRODUCTOS ---
  const productChunks: any[][] = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    productChunks.push(products.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Procesando productos en ${productChunks.length} lote(s)...`);

  for (let index = 0; index < productChunks.length; index++) {
    const chunk = productChunks[index];
    try {
      const batch = writeBatch(db);
      let opsCount = 0;

      chunk.forEach((p: any) => {
        if (!p || !p.id) return; // Saltar vacíos
        
        // Sanitizar ID (convertir a string y quitar espacios)
        const safeId = String(p.id).trim();
        if (safeId === "" || safeId.includes("/")) {
          console.warn(`⚠️ Producto omitido por ID inválido: ${safeId}`, p);
          return;
        }

        const productData = {
          ...p,
          id: safeId,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
        };
        const docRef = doc(db, "products", safeId);
        batch.set(docRef, productData);
        opsCount++;
      });

      if (opsCount > 0) {
        await batch.commit();
        processedCount += opsCount;
        console.log(`✅ Lote ${index + 1}/${productChunks.length} subido (${opsCount} productos).`);
      }
    } catch (err) {
      console.error(`❌ Error subiendo el lote ${index + 1}:`, err);
      throw err; // Detener si hay un error crítico de red/permisos
    }
  }

  // --- PROCESAR CLIENTES (Si existen) ---
  if (clients && clients.length > 0) {
    console.log("👥 Procesando clientes...");
    const clientBatch = writeBatch(db); // Asumimos que clientes son menos de 500, si no, aplicar misma lógica
    clients.forEach(c => {
      if (!c || !c.id) return;
      const safeClientId = String(c.id).trim();
      const docRef = doc(db, "clients", safeClientId);
      clientBatch.set(docRef, c);
    });
    await clientBatch.commit();
  }

  console.log(`🎉 Carga masiva FINALIZADA. Total productos procesados: ${processedCount}`);
};

// 5. Login Admin
export const loginAdmin = async (username: string, password: string, captchaToken: string | null) => {
  if (!captchaToken) {
    console.error("Seguridad: Intento de login sin resolver Captcha.");
    return false;
  }

  try {
    // Buscamos primero solo por usuario para evitar problemas de tipos (number vs string) en la contraseña
    const q = query(collection(db, "Loging"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`Error de inicio de sesión: No se encontró usuario con el nombre '${username}'`);
      return false;
    }

    const adminData = querySnapshot.docs[0].data();
    
    // Compara la contraseña proporcionada con el hash almacenado de forma segura
    const passwordMatch = await bcrypt.compare(password, adminData.password);

    return passwordMatch;
  } catch (e) {
    console.error("Error durante el inicio de sesión del administrador:", e);
    return false;
  }
};

// 6. Actualizar Contraseña Admin
export const updateAdminPassword = async (username: string, newPass: string) => {
  try {
    const q = query(collection(db, "Loging"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        console.error("No se puede actualizar la contraseña, usuario no encontrado.");
        return false;
    }
    
    const docId = querySnapshot.docs[0].id;
    const adminRef = doc(db, "Loging", docId);

    // Hashear la nueva contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    await updateDoc(adminRef, { password: hashedPassword });
    return true;
  } catch (e) {
    console.error("Error al actualizar la contraseña:", e);
    throw e;
  }
};
