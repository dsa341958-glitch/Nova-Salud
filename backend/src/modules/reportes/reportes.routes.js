import { Router } from 'express';
import { query } from 'express-validator';
import { dashboard, ventas, masVendidos, tiempoAtencion, inventario, reposicion } from './reportes.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();

const filtroFechas = [
  query('desde').optional().isISO8601({ strict: true }).withMessage('"desde" debe ser AAAA-MM-DD'),
  query('hasta').optional().isISO8601({ strict: true }).withMessage('"hasta" debe ser AAAA-MM-DD'),
];

router.use(autenticar, permitirRoles('ADMIN', 'FARMACEUTICO'));

router.get('/dashboard', dashboard);
router.get('/ventas', filtroFechas, validar, ventas);
router.get('/mas-vendidos', filtroFechas, query('limite').optional().isInt({ min: 1, max: 50 }), validar, masVendidos);
router.get('/tiempo-atencion', filtroFechas, query('meta').optional().isInt({ min: 1, max: 7200 }), validar, tiempoAtencion);
router.get('/inventario', filtroFechas, validar, inventario);
router.get('/reposicion', reposicion);

export default router;