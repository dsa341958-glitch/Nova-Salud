import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
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

app.use(noEncontrado);
app.use(manejarErrores);

export default app;