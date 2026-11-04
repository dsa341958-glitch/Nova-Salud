import { Router } from 'express';
import { param, query } from 'express-validator';
import { listar, resumen, marcarVista, marcarTodasVistas, generarAhora } from './alertas.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();
const puedeGestionar = permitirRoles('ADMIN', 'FARMACEUTICO');

router.use(autenticar);

// Todos los roles ven las alertas (el cajero necesita saber qué falta)
router.get('/',
  query('estado').optional().isIn(['activas', 'NUEVA', 'VISTA', 'ATENDIDA']),
  query('tipo').optional().isIn(['SIN_STOCK', 'STOCK_BAJO', 'POR_VENCER', 'VENCIDO']),
  validar, listar);
router.get('/resumen', resumen);

router.post('/generar', puedeGestionar, generarAhora);
router.patch('/vistas', puedeGestionar, marcarTodasVistas);
router.patch('/:id/vista', puedeGestionar, param('id').isInt({ min: 1 }), validar, marcarVista);

export default router;