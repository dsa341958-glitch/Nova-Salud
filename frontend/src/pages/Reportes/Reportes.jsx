import { useState } from 'react';
import RepVentas from './RepVentas';
import RepMasVendidos from './RepMasVendidos';
import RepAtencion from './RepAtencion';
import RepInventario from './RepInventario';

const TABS = [
  { id: 'ventas', texto: 'Ventas' },
  { id: 'vendidos', texto: 'Más vendidos' },
  { id: 'atencion', texto: 'Atención' },
  { id: 'inventario', texto: 'Inventario' },
];

export default function Reportes() {
  const [tab, setTab] = useState('ventas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const rangoInvalido = desde && hasta && desde > hasta;

  return (
    <>
      <div className="cabecera">
        <h1>Reportes</h1>
        <div className="acciones">
          <label className="check-simple">Desde <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
          <label className="check-simple">Hasta <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
          {(desde || hasta) && <button className="btn" onClick={() => { setDesde(''); setHasta(''); }}>Últimos 30 días</button>}
        </div>
      </div>
      <p className="suave" style={{ marginTop: '-.5rem' }}>Sin fechas se muestran los últimos 30 días. La reposición y el valor del stock son siempre de hoy.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'activo' : ''}`} onClick={() => setTab(t.id)}>{t.texto}</button>
        ))}
      </div>

      {rangoInvalido ? <div className="error">La fecha "Desde" no puede ser posterior a "Hasta".</div> : (
        <>
          {tab === 'ventas' && <RepVentas desde={desde} hasta={hasta} />}
          {tab === 'vendidos' && <RepMasVendidos desde={desde} hasta={hasta} />}
          {tab === 'atencion' && <RepAtencion desde={desde} hasta={hasta} />}
          {tab === 'inventario' && <RepInventario desde={desde} hasta={hasta} />}
        </>
      )}
    </>
  );
}