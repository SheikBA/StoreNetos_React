// Catálogo de productos Store Netos
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number;
  imageUrl?: string;
}

export const products: Product[] = [
  { id: 'AMP01', name: 'Amper Azul', categoryId: 'BEB01', unit: 'PIEZA', price: 21, imageUrl: 'https://www.soriana.com/on/demandware.static/-/Sites-soriana-grocery-master-catalog/default/dw3fbed1e8/images/product/7506192507714_A.jpg' },
  { id: 'JAP01', name: 'Japones', categoryId: 'CAC01', unit: 'PIEZA', price: 15 },
  { id: 'KAN01', name: 'Kacang', categoryId: 'CAC01', unit: 'PIEZA', price: 15, imageUrl: 'https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00750047803871L.jpg?odnHeight=612&odnWidth=612&odnBg=FFFFFF' },
  { id: 'PAL01', name: 'Palanqueta Chica', categoryId: 'CAC01', unit: 'PIEZA', price: 6, imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.NmzMjeAxHxv2mT9U3ex7BwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'PAL01G', name: 'Palanqueta Grande', categoryId: 'CAC01', unit: 'PIEZA', price: 13, imageUrl: 'https://villaverdenaturista.com/wp-content/uploads/2024/11/Palanqueta-Dianita.jpg' },
  { id: 'TRI01', name: 'Trident 10 pastillas Fresmint', categoryId: 'CHI01', unit: 'PIEZA', price: 13, imageUrl: 'https://tse3.mm.bing.net/th/id/OIP.yJVL7HXBvW4cYxjOcPu5bgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'TRI02', name: 'Trident 10 pastillas Yerbabuena', categoryId: 'CHI01', unit: 'PIEZA', price: 13, imageUrl: 'https://merkabastos.com/wp-content/uploads/2024/05/20624.jpg' },
  { id: 'CLO01', name: 'Clorets 2 pastillas', categoryId: 'CHI01', unit: 'PIEZA', price: 2, imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.vyuY0sfBy48h1knEUkCHawAAAA?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'HER01', name: 'Hersheys', categoryId: 'CHOC01', unit: 'PIEZA', price: 4, imageUrl: 'https://c8.alamy.com/comp/DH7NKK/hersheys-chocolates-DH7NKK.jpg' },
  { id: 'PUL01', name: 'Pulparindo Clasico', categoryId: 'DUL01', unit: 'PIEZA', price: 5, imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.FSXTxx6CR2T8044otmeVEAHaHa?cb=defcache2defcache=1&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'MAZ01', name: 'Mazapan Clasico', categoryId: 'DUL01', unit: 'PIEZA', price: 5, imageUrl: 'https://i.imgur.com/GWWpuDt.jpeg' },
  // ...continúa con el resto del catálogo
];
