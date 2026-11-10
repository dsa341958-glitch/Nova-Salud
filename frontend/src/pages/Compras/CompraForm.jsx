import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';
import { soles } from '../../utils/format';

const redondear = (n) => Math.round(n * 100) / 100;
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const lineaVacia = () => ({ key: Math.random(), productoId: '', codigoLote: '', fechaVencimiento: '', cantidad: '', costoUnitario: '' });

export default function CompraForm({ onGuardado, onCerrar }) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [nroDocumento, setNroDocumento] = useState('');
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/proveedores', { params: { activos: true } }).then(({ data }) => setProveedores(data.proveedores)).catch((e) => setError(mensajeError(e)));
    api.get('/productos', { params: { estado: 'activos', limite: 100 } }).then(({ data }) => setProductos(data.productos)).catch((e) => setError(mensajeError(e)));
  }, []);

  const cambiar = (key, campo, valor) =>
    setLineas(lineas.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
  const quitar = (key) => setLineas(lineas.filter((l) => l.key !== key));

  const total = redondear(lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.costoUnitario) || 0), 0));

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones rápidas antes de enviar (el servidor vuelve a validar)
    const hoy = hoyISO();
    const vistos = new Set();
    for (const l of lineas) {
      const id = `${l.productoId}|${l.codigoLote.trim().toUpperCase()}`;
      if (vistos.has(id)) { setError(`El lote "${l.codigoLote}" está repetido para el mismo producto`); return; }
      vistos.add(id);
      if (l.fechaVencimiento <= hoy) { setError(`El lote "${l.codigoLote}" debe vencer después de hoy`); return; }
    }

    setGuardando(true);
    try {
      await api.post('/compras', {
        proveedorId: Number(proveedorId),
        nroDocumento: nroDocumento.trim() || undefined,
        items: lineas.map((l) => ({
          productoId: Number(l.productoId),
          codigoLote: l.codigoLote.trim(),
          fechaVencimiento: l.fechaVencimiento,
          cantidad: Number(l.cantidad),
          costoUnitario: Number(l.costoUnitario),
        })),
      });
      window.dispatchEvent(new Event('alertas:cambio'));
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Nueva compra" onCerrar={onCerrar} ancho>
      <form onSubmit={enviar}>
        <div className="grid-2">
          <label className="campo">Proveedor *
            <select className="input" required value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Selecciona…</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
            </select>
          </label>
          <label className="campo">N.º de documento
            <input className="input" maxLength={30} placeholder="Ej: F001-1234" value={nroDocumento}
              onChange={(e) => setNroDocumento(e.target.value)} />
          </label>
        </div>

        <h2>Productos recibidos</h2>
        {lineas.map((l, i) => (
          <div key={l.key} className="linea-compra">
            <label className="campo">{i === 0 && 'Producto *'}
              <select className="input" required value={l.productoId} onChange={(e) => cambiar(l.key, 'productoId', e.target.value)} aria-label="Producto">
                <option value="">Producto…</option>
                {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="campo">{i === 0 && 'Lote *'}
              <input className="input" required maxLength={50} placeholder="Lote" value={l.codigoLote}
                onChange={(e) => cambiar(l.key, 'codigoLote', e.target.value)} aria-label="Código de lote" />
            </label>
            <label className="campo">{i === 0 && 'Vence *'}
              <input className="input" type="date" required min={hoyISO()} value={l.fechaVencimiento}
                onChange={(e) => cambiar(l.key, 'fechaVencimiento', e.target.value)} aria-label="Fecha de vencimiento" />
            </label>
            <label className="campo">{i === 0 && 'Cant. *'}
              <input className="input" type="number" required min="1" step="1" value={l.cantidad}
                onChange={(e) => cambiar(l.key, 'cantidad', e.target.value)} aria-label="Cantidad" />
            </label>
            <label className="campo">{i === 0 && 'Costo unit. *'}
              <input className="input" type="number" required min="0" step="0.01" value={l.costoUnitario}
                onChange={(e) => cambiar(l.key, 'costoUnitario', e.target.value)} aria-label="Costo unitario" />
            </label>
            <button type="button" className="btn-icono" disabled={lineas.length === 1} onClick={() => quitar(l.key)} aria-label="Quitar línea">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button type="button" className="btn" onClick={() => setLineas([...lineas, lineaVacia()])}>
          <Plus size={16} /> Agregar producto
        </button>

        <div className="fila-total total-grande" style={{ margin: '1rem 0' }}><span>Total de la compra</span><span>{soles(total)}</span></div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar compra'}</button>
        </div>
      </form>
    </Modal>
  );
}