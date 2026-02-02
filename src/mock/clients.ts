// Cartera de clientes Store Netos
export interface Client {
  department: string;
  name: string;
  totalPurchase: number;
  payment: number;
  balance: number;
  lastUpdate: string;
  paymentDate?: string;
  id: string;
}

export const clients: Client[] = [
  { department: 'BUSINESS ANALISYS', name: 'TEST', totalPurchase: 0, payment: 0, balance: 0, lastUpdate: '13.01.2026', id: 'VLADISLAV01' },
  { department: 'BUSINESS ANALISYS', name: 'SAMUEL DZUL', totalPurchase: 0, payment: 0, balance: 0, lastUpdate: '26.01.2026', paymentDate: '26.01.2026', id: 'SN2026010401' },
  { department: 'TESORERIA', name: 'ABISAC', totalPurchase: 131, payment: 0, balance: 131, lastUpdate: '13.01.2026', id: 'SN2026010603' },
  { department: 'DESARROLLO', name: 'MANUEL CHAN', totalPurchase: 15, payment: 10, balance: 5, lastUpdate: '21.01.2026', paymentDate: '21.01.2026', id: 'SN2026011209' },
  { department: 'JURIDICO', name: 'MARIA LUNA', totalPurchase: 36.5, payment: 0, balance: 36.5, lastUpdate: '13.01.2026', id: 'SN2026010704' },
  { department: 'PATRIMONIAL', name: 'YARELI JURIDICO', totalPurchase: 55.5, payment: 20, balance: 35.5, lastUpdate: '13.01.2026', id: 'SN2026010203' },
  { department: 'COMPRAS', name: 'MARESA GERARDO', totalPurchase: 57, payment: 0, balance: 57, lastUpdate: '', paymentDate: '20.01.2026', id: 'SN2026012522' },
  { department: 'COMPRAS', name: 'NALLELY PARGA', totalPurchase: 30, payment: 0, balance: 30, lastUpdate: '14.01.2026', id: 'SN2026011108' },
  { department: 'COMERCIAL', name: 'ROMEO GONZALEZ', totalPurchase: 75, payment: 0, balance: 75, lastUpdate: '14.01.2026', id: 'SN2026011007' },
  { department: 'PATRIMONIAL', name: 'ANA LUISA VENTURA', totalPurchase: 18, payment: 0, balance: 18, lastUpdate: '14.01.2026', id: 'SN2026010805' },
  // ...continúa con el resto de la cartera
];
