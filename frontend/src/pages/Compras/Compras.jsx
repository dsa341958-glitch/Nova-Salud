import { useState } from 'react';
import ListaCompras from './ListaCompras';
import Proveedores from './Proveedores';

export default function Compras() {
  const [tab, setTab] = useState('compras');
  return (
    <>
      <h1>Compras</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'compras' ? 'activo' : ''}`} onClick={() => setTab('compras')}>Compras</button>
        <button className={`tab ${tab === 'proveedores' ? 'activo' : ''}`} onClick={() => setTab('proveedores')}>Proveedores</button>
      </div>
      {tab === 'compras' ? <ListaCompras /> : <Proveedores />}
    </>
  );
}