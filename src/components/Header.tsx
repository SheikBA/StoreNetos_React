import React, { useState } from 'react';
import './Header.css';

const clientData = {
  nombre: 'Juan Pérez',
  departamento: 'Ventas',
  saldo: '$10,000.00',
  fecha: '30/01/2026',
};

export const Header: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <header className="header">
      <div className="logo-section">
        <img src="/Logo_StoreNetos_V2.png" alt="Logo Store Netos" className="logo" />
        <span className="store-name">STORE NETOS PREMIUM</span>
      </div>
      <button className="button" onClick={() => setShowModal(true)}>
        VER SALDO
      </button>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Saldo del Cliente</h2>
            <p><strong>Nombre:</strong> {clientData.nombre}</p>
            <p><strong>Departamento:</strong> {clientData.departamento}</p>
            <p><strong>Saldo total:</strong> {clientData.saldo}</p>
            <p><strong>Fecha de actualización:</strong> {clientData.fecha}</p>
            <button className="button" onClick={() => setShowModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </header>
  );
};
