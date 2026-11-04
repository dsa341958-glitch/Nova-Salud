import { Router } from 'express';
import { body, param } from 'express-validator';
import { registrar, listar, obtener, anular } from './compras.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('ADMIN', 'FARMACEUTICO'));

router.get('/', listar);
router.get('/:id', param('id').isInt({ min: 1 }), validar, obtener);

router.post('/',
  body('proveedorId').isInt({ min: 1 }).withMessage('Proveedor inválido').toInt(),
  body('nroDocumento').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }),
  body('items').isArray({ min: 1 }).withMessage('Agrega al menos un producto'),
  body('items.*.productoId').isInt({ min: 1 }).withMessage('Producto inválido').toInt(),
  body('items.*.codigoLote').trim().notEmpty().withMessage('El código de lote es obligatorio').isLength({ max: 50 }),
  body('items.*.fechaVencimiento').matches(/^\d{4}-\d{2}-\d{2}$/).isISO8601({ strict: true })
    .withMessage('Fecha de vencimiento inválida (usa AAAA-MM-DD)'),
  body('items.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad inválida').toInt(),
  body('items.*.costoUnitario').isFloat({ min: 0 }).withMessage('Costo inválido').toFloat(),
  validar, registrar);

router.patch('/:id/anular', permitirRoles('ADMIN'),
  param('id').isInt({ min: 1 }),
  body('motivo').trim().isLength({ min: 5, max: 255 }).withMessage('El motivo es obligatorio'),
  validar, anular);

export default router;