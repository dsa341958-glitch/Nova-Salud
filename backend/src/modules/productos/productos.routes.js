import { Router } from 'express';
import { body, param } from 'express-validator';
import { listar, buscarPOS, obtener, crear, actualizar, cambiarEstado } from './productos.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();
const puedeEditar = permitirRoles('ADMIN', 'FARMACEUTICO');

const reglasProducto = [
  body('categoriaId').isInt({ min: 1 }).withMessage('Categoría inválida').toInt(),
  body('codigoBarras').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 150 }),
  body('principioActivo').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 150 }),
  body('laboratorio').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('presentacion').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 60 }),
  body('requiereReceta').optional().isBoolean().toBoolean(),
  body('precioVenta').isFloat({ min: 0 }).withMessage('Precio inválido').toFloat(),
  body('stockMinimo').isInt({ min: 0 }).withMessage('Stock mínimo inválido').toInt(),
];

router.use(autenticar);

// Importante: /buscar va ANTES de /:id
router.get('/buscar', buscarPOS);
router.get('/', listar);
router.get('/:id', param('id').isInt({ min: 1 }), validar, obtener);
router.post('/', puedeEditar, reglasProducto, validar, crear);
router.put('/:id', puedeEditar, param('id').isInt({ min: 1 }), reglasProducto, validar, actualizar);
router.patch('/:id/estado', puedeEditar,
  param('id').isInt({ min: 1 }),
  body('activo').isBoolean().withMessage('"activo" debe ser true o false').toBoolean(),
  validar, cambiarEstado);

export default router;