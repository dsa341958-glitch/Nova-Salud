import { useState } from 'react';
import api, { mensajeError } from '../../api/client';
import Modal from '../../components/Modal';

const inicial = (p) => ({
  categoriaId: p?.categoria_id ?? '',
  codigoBarras: p?.codigo_barras ?? '',
  nombre: p?.nombre ?? '',
  principioActivo: p?.principio_activo ?? '',
  laboratorio: p?.laboratorio ?? '',
  presentacion: p?.presentacion ?? '',
  requiereReceta: !!p?.requiere_receta,
  precioVenta: p?.precio_venta ?? '',
  stockMinimo: p?.stock_minimo ?? 10,
});

export default function ProductoForm({ producto, categorias, onGuardado, onCerrar }) {
  const [f, setF] = useState(inicial(producto));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = {
        ...f,
        nombre: f.nombre.trim(),
        categoriaId: Number(f.categoriaId),
        precioVenta: Number(f.precioVenta),
        stockMinimo: Number(f.stockMinimo),
      };
      if (producto) await api.put(`/productos/${producto.id}`, payload);
      else await api.post('/productos', payload);
      onGuardado();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={producto ? 'Editar producto' : 'Nuevo producto'} onCerrar={onCerrar} ancho>
      <form onSubmit={enviar}>
        <label className="campo">Nombre *
          <input className="input" required maxLength={150} value={f.nombre} onChange={cambiar('nombre')} autoFocus />
        </label>

        <div className="grid-2">
          <label className="campo">Categoría *
            <select className="input" required value={f.categoriaId} onChange={cambiar('categoriaId')}>
              <option value="">Selecciona…</option>
              {categorias.filter((c) => c.activo).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="campo">Código de barras
            <input className="input" maxLength={50} value={f.codigoBarras} onChange={cambiar('codigoBarras')} />
          </label>
        </div>

        <div className="grid-2">
          <label className="campo">Principio activo
            <input className="input" maxLength={150} value={f.principioActivo} onChange={cambiar('principioActivo')} />
          </label>
          <label className="campo">Laboratorio
            <input className="input" maxLength={100} value={f.laboratorio} onChange={cambiar('laboratorio')} />
          </label>
        </div>

        <label className="campo">Presentación
          <input className="input" maxLength={60} placeholder="Ej: Caja x 100 tabletas" value={f.presentacion} onChange={cambiar('presentacion')} />
        </label>

        <div className="grid-2">
          <label className="campo">Precio de venta (S/) *
            <input className="input" type="number" required min="0" step="0.01" value={f.precioVenta} onChange={cambiar('precioVenta')} />
          </label>
          <label className="campo">Stock mínimo *
            <input className="input" type="number" required min="0" step="1" value={f.stockMinimo} onChange={cambiar('stockMinimo')} />
          </label>
        </div>

        <label className="check campo">
          <input type="checkbox" checked={f.requiereReceta} onChange={(e) => setF({ ...f, requiereReceta: e.target.checked })} />
          Requiere receta médica
        </label>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="grid-2">
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}