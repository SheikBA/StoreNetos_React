import { collection, getDocs, writeBatch, doc, runTransaction, getDoc, query, where, updateDoc, addDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import bcrypt from 'bcryptjs';

// Definimos la estructura de nuestros datos
export interface Product {
  id: string; // Firestore usa strings para IDs
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
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: { id: string; name: string; qty: number; price: number }[];
  total: number;
  paymentType: 'efectivo' | 'credito';
  date: string; // ISO Date string
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
    console.error(`No se encontró cliente con el ID único: ${uniqueId}`);
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
export const processOrderAndDecreaseStock = async (orderData: any, items: { id: string, quantity: number }[]) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Primero, validamos y descontamos el stock de cada producto
      for (const item of items) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw `El producto con ID ${item.id} no existe y no se puede completar la orden.`;
        }

        const currentStock = productDoc.data().stock;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw `No hay suficiente stock para "${productDoc.data().name}". Disponible: ${currentStock}, Solicitado: ${item.quantity}.`;
        }

        transaction.update(productRef, { stock: newStock });
      }

      // 2. Si la compra es a crédito, actualizamos el saldo del cliente
      if (orderData.paymentType === 'credito' && orderData.clientId) {
        const clientRef = doc(db, "clients", orderData.clientId);
        const clientDoc = await transaction.get(clientRef);

        if (clientDoc.exists()) {
          const currentBalance = clientDoc.data().balance || 0;
          const currentTotalPurchase = clientDoc.data().totalPurchase || 0;
          
          transaction.update(clientRef, {
            balance: Number((currentBalance + orderData.total).toFixed(2)),
            totalPurchase: Number((currentTotalPurchase + orderData.total).toFixed(2)),
            lastUpdate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.')
          });
        }
      }

      // Si todo el stock es válido, creamos el documento de la orden
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, orderData);
    });
  } catch (e) {
    console.error("Error en la transacción de la orden: ", e);
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
    console.error("Error adding product: ", e);
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
    console.error("Error updating product: ", e);
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
    console.error("Error toggling product block status: ", e);
    throw e;
  }
};

// Eliminar producto
export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (e) {
    console.error("Error deleting product: ", e);
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
    console.error("Error adding client: ", e);
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
    console.error("Error updating client: ", e);
    throw e;
  }
};

// Eliminar cliente
export const deleteClient = async (id: string) => {
  try {
    await deleteDoc(doc(db, "clients", id));
  } catch (e) {
    console.error("Error deleting client: ", e);
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
    console.error("Error registering payment: ", e);
    throw e;
  }
};

// 4. Migración de Datos (Seed)
export const seedDatabase = async (products: any[], clients: any[]) => {
  const batch = writeBatch(db);

  // Preparar productos
  products.forEach(p => {
    const docRef = doc(db, "products", p.id); // Usamos el ID del mock como ID del documento
    batch.set(docRef, p);
  });

  // Preparar clientes
  clients.forEach(c => {
    const docRef = doc(db, "clients", c.id);
    batch.set(docRef, c);
  });

  await batch.commit();
};

// 5. Login Admin
export const loginAdmin = async (username: string, password: string) => {
  try {
    // Buscamos primero solo por usuario para evitar problemas de tipos (number vs string) en la contraseña
    const q = query(collection(db, "Loging"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`Login failed: No user found with username '${username}'`);
      return false;
    }

    const adminData = querySnapshot.docs[0].data();
    
    // Compara la contraseña proporcionada con el hash almacenado de forma segura
    const passwordMatch = await bcrypt.compare(password, adminData.password);

    return passwordMatch;
  } catch (e) {
    console.error("Error during admin login: ", e);
    return false;
  }
};

// 6. Actualizar Contraseña Admin
export const updateAdminPassword = async (username: string, newPass: string) => {
  try {
    const q = query(collection(db, "Loging"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        console.error("Cannot update password, user not found.");
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
    console.error("Error updating password: ", e);
    throw e;
  }
};
