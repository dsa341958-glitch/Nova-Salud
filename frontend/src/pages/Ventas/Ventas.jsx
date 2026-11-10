import { useEffect, useRef, useState } from 'react';
import { Search, Trash2, Plus, Minus, ShoppingCart, Timer } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import useDebounce from '../../hooks/useDebounce';
import { soles } from '../../utils/format';
import ClienteSelector from './ClienteSelector';
import Comprobante from './Comprobante';

const METODOS = [
  { v: 'EFECTIVO', t: 'Efectivo' },
  { v: 'TARJETA', t: 'Tarjeta' },
  { v: 'YAPE_PLIN', t: 'Yape / Plin' },
  { v: 'OTRO', t: 'Otro' },
];
const redondear = (n) => Math.round(n * 100) / 100;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Ventas() {
  const [q, setQ] = useState('');
  const qDeb = useDebounce(q);
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [carrito, setCarrito] = useState([]);          // [{ producto, cantidad }]
  const [cliente, setCliente] = useState(null);
  const [tipo, setTipo] = useState('TICKET');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [recibido, setRecibido] = useState('');
  const [receta, setReceta] = useState(false);

  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [venta, setVenta] = useState(null);
  const [segundos, setSegundos] = useState(0);

  const inicio = useRef(null);
  const inputRef = useRef(null);
  const hayItems = carrito.length > 0;

  // Búsqueda con espera (debounce)
  useEffect(() => {
    const texto = qDeb.trim();
    if (texto.length < 2) { setResultados([]); return; }
    let vigente = true;
    setBuscando(true);
    api.get('/productos/buscar', { params: { q: texto } })
      .then(({ data }) => vigente && setResultados(data.productos))
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setBuscando(false));
    return () => { vigente = false; };
  }, [qDeb]);

  // Cronómetro: arranca con el primer producto y se reinicia al vaciar el carrito
  useEffect(() => {
    if (!hayItems) { inicio.current = null; setSegundos(0); return; }
    if (!inicio.current) inicio.current = Date.now();
    const id = setInterval(() => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [hayItems]);

  const cambiarBusqueda = (valor) => {
    setQ(valor);
    if (valor.trim().length < 2) setResultados([]);
  };

  const agregar = (p) => {
    setError('');
    if (p.stock_total <= 0) { setError(`"${p.nombre}" no tiene stock disponible`); return; }
    const existente = carrito.find((x) => x.producto.id === p.id);
    if (existente) {
      if (existente.cantidad >= p.stock_total) {
        setError(`Solo hay ${p.stock_total} unidades de "${p.nombre}"`);
        return;
      }
      setCarrito(carrito.map((x) => (x.producto.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x)));
    } else {
      setCarrito([...carrito, { producto: p, cantidad: 1 }]);
    }
    setQ('');
    setResultados([]);
    inputRef.current?.focus();
  };

  // Enter: sirve para el lector de códigos de barras (escribe rápido y envía Enter)
  const alPresionar = async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const texto = q.trim();
    if (texto.length < 2) return;
    try {
      const { data } = await api.get('/productos/buscar', { params: { q: texto } });
      const lista = data.productos;
      const elegido = lista.find((p) => p.codigo_barras === texto) || (lista.length === 1 ? lista[0] : null);
      if (elegido) agregar(elegido);
      else { setResultados(lista); if (!lista.length) setError('Producto no encontrado'); }
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  const cambiarCantidad = (id, valor) => {
    setError('');
    setCarrito(carrito.map((x) => {
      if (x.producto.id !== id) return x;
      const max = x.producto.stock_total;
      const n = Math.min(Math.max(Number(valor) || 1, 1), max);
      return { ...x, cantidad: n };
    }));
  };

  const quitar = (id) => setCarrito(carrito.filter((x) => x.producto.id !== id));

  const elegirCliente = (c) => {
    setCliente(c);
    if (tipo === 'FACTURA' && c?.tipo_documento !== 'RUC') setTipo('TICKET');
  };

  const limpiar = () => {
    setCarrito([]); setCliente(null); setTipo('TICKET'); setMetodo('EFECTIVO');
    setRecibido(''); setReceta(false); setQ(''); setResultados([]); setError('');
  };

  // Totales (el precio ya incluye IGV, igual que en el backend)
  const total = redondear(carrito.reduce((s, x) => s + x.cantidad * x.producto.precio_venta, 0));
  const base = redondear(total / 1.18);
  const igv = redondear(total - base);
  const requiereReceta = carrito.some((x) => x.producto.requiere_receta);
  const recibidoNum = Number(recibido) || 0;
  const faltaDinero = metodo === 'EFECTIVO' && recibido !== '' && recibidoNum < total;
  const vuelto = metodo === 'EFECTIVO' && recibidoNum >= total ? redondear(recibidoNum - total) : null;
  const puedeCobrar = hayItems && !enviando && !faltaDinero && (!requiereReceta || receta);

  const cobrar = async () => {
    setError('');
    setEnviando(true);
    try {
      const duracion = inicio.current ? Math.floor((Date.now() - inicio.current) / 1000) : 0;
      const { data } = await api.post('/ventas', {
        clienteId: cliente?.id,
        tipoComprobante: tipo,
        metodoPago: metodo,
        duracionSegundos: Math.min(duracion, 7200),
        recetaVerificada: requiereReceta ? receta : undefined,
        items: carrito.map((x) => ({ productoId: x.producto.id, cantidad: x.cantidad })),
      });
      setVenta({ ...data.venta, recibido: metodo === 'EFECTIVO' && recibido ? recibidoNum : null });
      limpiar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  const cerrarComprobante = () => {
    setVenta(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      <h1>Punto de venta</h1>
      <div className="pos">
        {/* ---------- Izquierda: búsqueda ---------- */}
        <div className="card">
          <div className="input-icono">
            <Search size={18} />
            <input ref={inputRef} className="input input-grande" autoFocus value={q}
              onChange={(e) => cambiarBusqueda(e.target.value)} onKeyDown={alPresionar}
              placeholder="Buscar por nombre, principio activo o escanear código de barras" />
          </div>

          <div style={{ marginTop: '1rem' }}>
            {q.trim().length < 2 && <p className="suave">Escribe al menos 2 letras o escanea un código.</p>}
            {buscando && <p className="suave">Buscando…</p>}
            {!buscando && q.trim().length >= 2 && resultados.length === 0 && (
              <p className="suave">Sin resultados para "{q.trim()}".</p>
            )}
            {resultados.map((p) => (
              <button key={p.id} className="resultado" disabled={p.stock_total <= 0} onClick={() => agregar(p)}>
                <div>
                  <strong>{p.nombre}</strong>
                  <div className="suave">{[p.presentacion, p.laboratorio].filter(Boolean).join(' · ')}</div>
                  <div style={{ display: 'flex', gap: '.4rem', marginTop: '.3rem' }}>
                    <span className={`etiqueta ${p.stock_total <= 0 ? 'roja' : p.stock_total <= p.stock_minimo ? 'alerta' : ''}`}>
                      {p.stock_total <= 0 ? 'Sin stock' : `Stock: ${p.stock_total}`}
                    </span>
                    {p.requiere_receta ? <span className="etiqueta alerta">Requiere receta</span> : null}
                  </div>
                </div>
                <strong>{soles(p.precio_venta)}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Derecha: carrito ---------- */}
        <div className="card">
          <div className="carrito-cab">
            <h2 style={{ margin: 0 }}><ShoppingCart size={18} /> Carrito</h2>
            <span className="cron"><Timer size={16} /> {mmss(segundos)}</span>
          </div>

          {!hayItems && <p className="suave">Aún no hay productos en la venta.</p>}

          {carrito.map(({ producto: p, cantidad }) => (
            <div key={p.id} className="linea">
              <div>
                <strong>{p.nombre}</strong>
                <div className="suave">{soles(p.precio_venta)} c/u</div>
              </div>
              <div className="cant">
                <button className="btn-icono" onClick={() => cambiarCantidad(p.id, cantidad - 1)} aria-label="Menos"><Minus size={14} /></button>
                <input className="input" type="number" min="1" max={p.stock_total} value={cantidad}
                  onChange={(e) => cambiarCantidad(p.id, e.target.value)} />
                <button className="btn-icono" onClick={() => cambiarCantidad(p.id, cantidad + 1)} aria-label="Más"><Plus size={14} /></button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{soles(cantidad * p.precio_venta)}</strong>
                <br />
                <button className="btn-icono" style={{ marginLeft: 'auto' }} onClick={() => quitar(p.id)} aria-label="Quitar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {hayItems && (
            <div style={{ marginTop: '1rem' }}>
              <ClienteSelector cliente={cliente} onChange={elegirCliente} />

              <div className="grid-2">
                <label className="campo">Comprobante
                  <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="TICKET">Ticket</option>
                    <option value="BOLETA">Boleta</option>
                    <option value="FACTURA" disabled={cliente?.tipo_documento !== 'RUC'}>
                      Factura {cliente?.tipo_documento !== 'RUC' ? '(requiere RUC)' : ''}
                    </option>
                  </select>
                </label>
                <label className="campo">Método de pago
                  <select className="input" value={metodo} onChange={(e) => { setMetodo(e.target.value); setRecibido(''); }}>
                    {METODOS.map((m) => <option key={m.v} value={m.v}>{m.t}</option>)}
                  </select>
                </label>
              </div>

              {metodo === 'EFECTIVO' && (
                <label className="campo">Monto recibido
                  <input className="input" type="number" min="0" step="0.10" value={recibido}
                    onChange={(e) => setRecibido(e.target.value)} placeholder="Opcional, para calcular el vuelto" />
                </label>
              )}

              {requiereReceta && (
                <label className="aviso check">
                  <input type="checkbox" checked={receta} onChange={(e) => setReceta(e.target.checked)} />
                  Verifiqué la receta médica de los productos que la requieren
                </label>
              )}

              <div className="totales">
                <div className="fila-total suave"><span>Subtotal</span><span>{soles(base)}</span></div>
                <div className="fila-total suave"><span>IGV (18%)</span><span>{soles(igv)}</span></div>
                <div className="fila-total total-grande"><span>Total</span><span>{soles(total)}</span></div>
                {vuelto !== null && recibido !== '' && (
                  <div className="fila-total"><strong>Vuelto</strong><strong>{soles(vuelto)}</strong></div>
                )}
                {faltaDinero && <div className="error">Faltan {soles(redondear(total - recibidoNum))}</div>}
              </div>
            </div>
          )}

          {error && <div className="error" style={{ margin: '.75rem 0' }} role="alert">{error}</div>}

          {hayItems && (
            <div className="grid-2" style={{ marginTop: '.75rem' }}>
              <button className="btn" onClick={limpiar} disabled={enviando}>Cancelar venta</button>
              <button className="btn btn-primario" onClick={cobrar} disabled={!puedeCobrar}>
                {enviando ? 'Registrando…' : `Cobrar ${soles(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {venta && <Comprobante venta={venta} onCerrar={cerrarComprobante} />}
    </>
  );
}