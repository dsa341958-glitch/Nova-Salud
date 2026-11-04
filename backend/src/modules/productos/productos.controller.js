import { HttpError, asyncHandler } from '../../utils/helpers.js';
import { productosRepository as repo } from './productos.repository.js';

export const listar = asyncHandler(async (req, res) => {
  const pagina = Math.max(Number(req.query.pagina) || 1, 1);
  const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 100);

  const { filas, total } = await repo.listar({
    q: req.query.q?.trim() || null,
    categoriaId: Number(req.query.categoria) || null,
    estado: req.query.estado,                       // activos | inactivos | (todos)
    bajoStock: req.query.bajoStock === 'true',
    pagina, limite,
  });

  res.json({ ok: true, productos: filas, paginacion: { pagina, limite, total, paginas: Math.ceil(total / limite) } });
});

export const buscarPOS = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 2) return res.json({ ok: true, productos: [] });
  res.json({ ok: true, productos: await repo.buscarPOS(q) });
});

export const obtener = asyncHandler(async (req, res) => {
  const producto = await repo.buscarPorId(Number(req.params.id));
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json({ ok: true, producto });
});

async function validarNegocio(d, idActual = null) {
  if (!(await repo.categoriaActiva(d.categoriaId))) throw new HttpError(400, 'La categoría no existe o está inactiva');
  if (d.codigoBarras) {
    const dup = await repo.buscarPorCodigoBarras(d.codigoBarras);
    if (dup && dup.id !== idActual) throw new HttpError(409, 'Ya existe un producto con ese código de barras');
  }
}

export const crear = asyncHandler(async (req, res) => {
  await validarNegocio(req.body);
  const id = await repo.crear(req.body);
  await repo.auditar({ usuarioId: req.user.id, accion: 'CREAR_PRODUCTO', registroId: id, detalle: { nombre: req.body.nombre }, ip: req.ip });
  res.status(201).json({ ok: true, producto: await repo.buscarPorId(id) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await validarNegocio(req.body, id);
  if (!(await repo.actualizar(id, req.body))) throw new HttpError(404, 'Producto no encontrado');
  await repo.auditar({ usuarioId: req.user.id, accion: 'EDITAR_PRODUCTO', registroId: id, detalle: req.body, ip: req.ip });
  res.json({ ok: true, producto: await repo.buscarPorId(id) });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await repo.cambiarEstado(id, req.body.activo))) throw new HttpError(404, 'Producto no encontrado');
  await repo.auditar({ usuarioId: req.user.id, accion: req.body.activo ? 'ACTIVAR_PRODUCTO' : 'DESACTIVAR_PRODUCTO', registroId: id, ip: req.ip });
  res.json({ ok: true, producto: await repo.buscarPorId(id) });
});