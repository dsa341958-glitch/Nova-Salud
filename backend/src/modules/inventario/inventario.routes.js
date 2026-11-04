import { Router } from 'express';
import { body, query } from 'express-validator';
import { listarLotes, kardex, ajustar } from './inventario.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();
const puedeEditar = permitirRoles('ADMIN', 'FARMACEUTICO');

router.use(autenticar);

router.get('/lotes',
  query('estado').optional().isIn(['vigentes', 'porVencer', 'vencidos']),
  validar, listarLotes);

router.get('/kardex', puedeEditar,
  query('tipo').optional().isIn(['ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA_VENCIMIENTO', 'ANULACION_VENTA']),
  query('desde').optional().isISO8601({ strict: true }),
  query('hasta').optional().isISO8601({ strict: true }),
  validar, kardex);

router.post('/ajustes', puedeEditar,
  body('loteId').isInt({ min: 1 }).toInt(),
  body('tipo').isIn(['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA_VENCIMIENTO']).withMessage('Tipo de ajuste inválido'),
  body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0').toInt(),
  body('motivo').trim().isLength({ min: 5, max: 255 }).withMessage('El motivo es obligatorio (mínimo 5 caracteres)'),
  validar, ajustar);

export default router;