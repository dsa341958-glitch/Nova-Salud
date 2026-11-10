import { useState } from 'react';
import Lotes from './Lotes';
import Kardex from './Kardex';

export default function Inventario() {
  const [tab, setTab] = useState('lotes');
  const [loteKardex, setLoteKardex] = useState(null);

  const verKardex = (lote) => { setLoteKardex(lote); setTab('kardex'); };

  return (
    <>
      <h1>Inventario</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'lotes' ? 'activo' : ''}`} onClick={() => setTab('lotes')}>Lotes</button>
        <button className={`tab ${tab === 'kardex' ? 'activo' : ''}`} onClick={() => setTab('kardex')}>Kardex</button>
      </div>
      {tab === 'lotes'
        ? <Lotes onVerKardex={verKardex} />
        : <Kardex lote={loteKardex} onQuitarLote={() => setLoteKardex(null)} />}
    </>
  );
}