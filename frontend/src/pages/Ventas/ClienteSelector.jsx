import { useEffect, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import useDebounce from '../../hooks/useDebounce';

const VACIO = { tipoDocumento: 'DNI', nroDocumento: '', nombres: '' };

export default function ClienteSelector({ cliente, onChange }) {
  const [q, setQ] = useState('');
  const qDeb = useDebounce(q);
  const [lista, setLista] = useState([]);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const t = qDeb.trim();
    if (t.length < 2) { setLista([]); return; }
    let vigente = true;
    api.get('/clientes/buscar', { params: { q: t } })
      .then(({ data }) => vigente && setLista(data.clientes))
      .catch(() => {});
    return () => { vigente = false; };
  }, [qDeb]);

  const elegir = (c) => { onChange(c); setQ(''); setLista([]); };

  const guardar = async () => {
    setError('');
    setGuardando(true);
    try {
      const { data } = await api.post('/clientes', {
        tipoDocumento: form.tipoDocumento,
        nroDocumento: form.nroDocumento.trim(),
        nombres: form.nombres.trim(),
      });
      elegir(data.cliente);
      setCreando(false);
      setForm(VACIO);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (cliente) {
    return (
      <div className="campo">
        <span>Cliente</span>
        <div className="chip-cliente">
          <div>
            <strong>{cliente.nombres}</strong>
            <small className="suave"> · {cliente.tipo_documento} {cliente.nro_documento}</small>
          </div>
          <button type="button" className="btn-icono" onClick={() => onChange(null)} aria-label="Quitar cliente">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (creando) {
    return (
      <div className="campo">
        <span>Nuevo cliente</span>
        <div className="grid-2">
          <select className="input" value={form.tipoDocumento}
            onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}>
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
            <option value="CE">C. Extranjería</option>
          </select>
          <input className="input" placeholder="N.º de documento" value={form.nroDocumento}
            onChange={(e) => setForm({ ...form, nroDocumento: e.target.value })} />
        </div>
        <input className="input" placeholder="Nombres o razón social" value={form.nombres}
          onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <div className="grid-2">
          <button type="button" className="btn" onClick={() => { setCreando(false); setError(''); }}>Cancelar</button>
          <button type="button" className="btn btn-primario" disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campo">
      <span>Cliente <small className="suave">(opcional)</small></span>
      <div className="input-icono">
        <Search size={16} />
        <input className="input" placeholder="Buscar por DNI, RUC o nombre" value={q}
          onChange={(e) => setQ(e.target.value)} />
      </div>
      {lista.length > 0 && (
        <div className="dropdown">
          {lista.map((c) => (
            <button type="button" key={c.id} onClick={() => elegir(c)}>
              <strong>{c.nombres}</strong> <small className="suave">{c.tipo_documento} {c.nro_documento}</small>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn" onClick={() => setCreando(true)}>
        <UserPlus size={16} /> Registrar cliente nuevo
      </button>
    </div>
  );
}