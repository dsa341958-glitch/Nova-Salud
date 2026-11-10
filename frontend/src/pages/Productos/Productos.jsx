import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Power, Tags } from 'lucide-react';
import api, { mensajeError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import { soles } from '../../utils/format';
import Paginacion from '../../components/Paginacion';
import ProductoForm from './ProductoForm';
import CategoriasModal from './CategoriasModal';

export default function Productos() {
  const { usuario } = useAuth();
  const gestiona = usuario.rol !== 'CAJERO';

  const [q, setQ] = useState('');
  const qDeb = useDebounce(q, 300);
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('activos');
  const [bajoStock, setBajoStock] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState({ productos: [], paginacion: null });
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [editando, setEditando] = useState(undefined);   // undefined = cerrado, null = nuevo, objeto = editar
  const [verCategorias, setVerCategorias] = useState(false);

  const cargarCategorias = useCallback(() => {
    api.get('/categorias').then(({ data }) => setCategorias(data.categorias)).catch(() => {});
  }, []);
  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get('/productos', {
      params: {
        q: qDeb.trim() || undefined,
        categoria: categoria || undefined,
        estado: gestiona ? estado || undefined : 'activos',   // el cajero solo ve activos
        bajoStock: bajoStock || undefined,
        pagina, limite: 15,
      },
    })
      .then(({ data }) => { if (vigente) { setDatos(data); setError(''); } })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [qDeb, categoria, estado, bajoStock, pagina, gestiona, recarga]);

  // Al cambiar un filtro se vuelve a la página 1
  const filtro = (setter) => (valor) => { setter(valor); setPagina(1); };

  const alternarEstado = async (p) => {
    const accion = p.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${accion} "${p.nombre}"?`)) return;
    try {
      await api.patch(`/productos/${p.id}/estado`, { activo: !p.activo });
      setRecarga((n) => n + 1);
    } catch (e) { setError(mensajeError(e)); }
  };

  const guardado = () => { setEditando(undefined); setRecarga((n) => n + 1); };

  return (
    <>
      <div className="cabecera">
        <h1>Productos</h1>
        {gestiona && (
          <div className="acciones">
            <button className="btn" onClick={() => setVerCategorias(true)}><Tags size={16} /> Categorías</button>
            <button className="btn btn-primario" onClick={() => setEditando(null)}><Plus size={16} /> Nuevo producto</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="filtros">
          <div className="input-icono filtro-buscar">
            <Search size={16} />
            <input className="input" placeholder="Buscar por nombre, principio activo o código" value={q}
              onChange={(e) => filtro(setQ)(e.target.value)} />
          </div>
          <select className="input" value={categoria} onChange={(e) => filtro(setCategoria)(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {gestiona && (
            <select className="input" value={estado} onChange={(e) => filtro(setEstado)(e.target.value)}>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="">Todos</option>
            </select>
          )}
          <label className="check-simple">
            <input type="checkbox" checked={bajoStock} onChange={(e) => filtro(setBajoStock)(e.target.checked)} />
            Solo bajo stock
          </label>
        </div>

        {error && <div className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</div>}

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th>
                {gestiona && <th>Mín.</th>}
                {gestiona && <th>Estado</th>}
                {gestiona && <th></th>}
              </tr>
            </thead>
            <tbody>
              {datos.productos.map((p) => (
                <tr key={p.id} style={{ opacity: p.activo ? 1 : .55 }}>
                  <td>
                    <strong>{p.nombre}</strong>
                    <div className="suave">{[p.principio_activo, p.presentacion, p.laboratorio].filter(Boolean).join(' · ')}</div>
                    <div className="suave">{p.codigo_barras ? `Cód. ${p.codigo_barras}` : 'Sin código de barras'}
                      {p.requiere_receta ? <span className="etiqueta alerta" style={{ marginLeft: '.4rem' }}>Receta</span> : null}
                    </div>
                  </td>
                  <td>{p.categoria}</td>
                  <td>{soles(p.precio_venta)}</td>
                  <td>
                    <span className={`etiqueta ${p.stock_total <= 0 ? 'roja' : p.stock_total <= p.stock_minimo ? 'alerta' : ''}`}>
                      {p.stock_total <= 0 ? 'Sin stock' : p.stock_total}
                    </span>
                  </td>
                  {gestiona && <td>{p.stock_minimo}</td>}
                  {gestiona && <td><span className={`etiqueta ${p.activo ? '' : 'gris'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>}
                  {gestiona && (
                    <td>
                      <div className="acciones">
                        <button className="btn-icono" title="Editar" aria-label="Editar" onClick={() => setEditando(p)}><Pencil size={16} /></button>
                        <button className="btn-icono" title={p.activo ? 'Desactivar' : 'Activar'} aria-label="Cambiar estado" onClick={() => alternarEstado(p)}><Power size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && datos.productos.length === 0 && <p className="suave vacio">No hay productos con esos filtros.</p>}
          {cargando && <p className="suave vacio">Cargando…</p>}
        </div>

        <Paginacion paginacion={datos.paginacion} onCambiar={setPagina} />
      </div>

      {editando !== undefined && (
        <ProductoForm producto={editando} categorias={categorias} onGuardado={guardado} onCerrar={() => setEditando(undefined)} />
      )}
      {verCategorias && <CategoriasModal onCerrar={() => setVerCategorias(false)} onCambio={cargarCategorias} />}
    </>
  );
}