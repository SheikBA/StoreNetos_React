import { Product } from '../services/storeService';

// Catálogo de productos Store Netos
export const products: Product[] = [
  { id: 'AMP01', name: 'Amper Azul', category: 'BEB01', unit: 'PIEZA', price: 21, image: 'https://www.soriana.com/on/demandware.static/-/Sites-soriana-grocery-master-catalog/default/dw3fbed1e8/images/product/7506192507714_A.jpg', stock: 100 },
  { id: 'JAP01', name: 'Japones', category: 'CAC01', unit: 'PIEZA', price: 15, image: '', stock: 100 },
  { id: 'KAN01', name: 'Kacang', category: 'CAC01', unit: 'PIEZA', price: 15, image: 'https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00750047803871L.jpg?odnHeight=612&odnWidth=612&odnBg=FFFFFF', stock: 100 },
  { id: 'PAL01', name: 'Palanqueta Chica', category: 'CAC01', unit: 'PIEZA', price: 6, image: 'https://tse4.mm.bing.net/th/id/OIP.NmzMjeAxHxv2mT9U3ex7BwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', stock: 100 },
  { id: 'PAL01G', name: 'Palanqueta Grande', category: 'CAC01', unit: 'PIEZA', price: 13, image: 'https://villaverdenaturista.com/wp-content/uploads/2024/11/Palanqueta-Dianita.jpg', stock: 100 },
  { id: 'TRI01', name: 'Trident 10 pastillas Fresmint', category: 'CHI01', unit: 'PIEZA', price: 13, image: 'https://tse3.mm.bing.net/th/id/OIP.yJVL7HXBvW4cYxjOcPu5bgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', stock: 100 },
  { id: 'TRI02', name: 'Trident 10 pastillas Yerbabuena', category: 'CHI01', unit: 'PIEZA', price: 13, image: 'https://merkabastos.com/wp-content/uploads/2024/05/20624.jpg', stock: 100 },
  { id: 'CLO01', name: 'Clorets 2 pastillas', category: 'CHI01', unit: 'PIEZA', price: 2, image: 'https://tse4.mm.bing.net/th/id/OIP.vyuY0sfBy48h1knEUkCHawAAAA?rs=1&pid=ImgDetMain&o=7&rm=3', stock: 100 },
  { id: 'HER01', name: 'Hersheys', category: 'CHOC01', unit: 'PIEZA', price: 4, image: 'https://c8.alamy.com/comp/DH7NKK/hersheys-chocolates-DH7NKK.jpg', stock: 100 },
  { id: 'PUL01', name: 'Pulparindo Clasico', category: 'DUL01', unit: 'PIEZA', price: 5, image: 'https://tse4.mm.bing.net/th/id/OIP.FSXTxx6CR2T8044otmeVEAHaHa?cb=defcache2defcache=1&rs=1&pid=ImgDetMain&o=7&rm=3', stock: 100 },
  { id: 'MAZ01', name: 'Mazapan Clasico', category: 'DUL01', unit: 'PIEZA', price: 5, image: 'https://i.imgur.com/GWWpuDt.jpeg', stock: 100 },
  // ...continúa con el resto del catálogo
];
