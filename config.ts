import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ IMPORTANTE: Reemplaza estos valores con los que copiaste de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBNKB9N6YIDYrSTOc2MhoObDCV4Zh1s4DA",
  authDomain: "storenetos-backend.firebaseapp.com",
  projectId: "storenetos-backend",
  storageBucket: "storenetos-backend.firebasestorage.app",
  messagingSenderId: "869101528217",
  appId: "1:869101528217:web:c80aeb41d82fe63ceb4408"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la referencia a la base de datos para usarla en la app
export const db = getFirestore(app);