import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { registrar, listar, obtener, anular } from './ventas.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();

router.use(autenticar);

router.post('/',
  body('clienteId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Cliente inválido').toInt(),
  body('tipoComprobante').optional().isIn(['TICKET', 'BOLETA', 'FACTURA']).withMessage('Tipo de comprobante inválido'),
  body('metodoPago').isIn(['EFECTIVO', 'TARJETA', 'YAPE_PLIN', 'OTRO']).withMessage('Método de pago inválido'),
  body('duracionSegundos').optional().isInt({ min: 0, max: 7200 }).withMessage('Duración inválida').toInt(),
  body('recetaVerificada').optional().isBoolean().toBoolean(),
  body('items').isArray({ min: 1, max: 100 }).withMessage('Agrega al menos un producto'),
  body('items.*.productoId').isInt({ min: 1 }).withMessage('Producto inválido').toInt(),
  body('items.*.cantidad').isInt({ min: 1, max: 1000 }).withMessage('Cantidad inválida').toInt(),
  validar, registrar);

router.get('/',
  query('estado').optional().isIn(['COMPLETADA', 'ANULADA']),
  query('desde').optional().isISO8601({ strict: true }),
  query('hasta').optional().isISO8601({ strict: true }),
  validar, listar);

router.get('/:id', param('id').isInt({ min: 1 }), validar, obtener);

router.patch('/:id/anular', permitirRoles('ADMIN', 'FARMACEUTICO'),
  param('id').isInt({ min: 1 }),
  body('motivo').trim().isLength({ min: 5, max: 255 }).withMessage('El motivo es obligatorio (mínimo 5 caracteres)'),
  validar, anular);

export default router;