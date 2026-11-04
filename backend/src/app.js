import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import categoriasRoutes from './modules/categorias/categorias.routes.js';
import productosRoutes from './modules/productos/productos.routes.js';
import proveedoresRoutes from './modules/proveedores/proveedores.routes.js';
import comprasRoutes from './modules/compras/compras.routes.js';
import inventarioRoutes from './modules/inventario/inventario.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import ventasRoutes from './modules/ventas/ventas.routes.js';
import alertasRoutes from './modules/alertas/alertas.routes.js';
import reportesRoutes from './modules/reportes/reportes.routes.js';
import { noEncontrado, manejarErrores } from './middlewares/error.middleware.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, db: 'sin conexión' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use(noEncontrado);
app.use(manejarErrores);

export default app;