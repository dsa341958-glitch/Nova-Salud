import { Router } from 'express';
import { body, param } from 'express-validator';
import { listar, crear, actualizar, cambiarEstado } from './categorias.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();
const puedeEditar = permitirRoles('ADMIN', 'FARMACEUTICO');

const reglasCategoria = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres'),
  body('descripcion').optional({ nullable: true }).trim().isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
];

router.use(autenticar);

router.get('/', listar);
router.post('/', puedeEditar, reglasCategoria, validar, crear);
router.put('/:id', puedeEditar, param('id').isInt({ min: 1 }), reglasCategoria, validar, actualizar);
router.patch('/:id/estado', puedeEditar,
  param('id').isInt({ min: 1 }),
  body('activo').isBoolean().withMessage('"activo" debe ser true o false').toBoolean(),
  validar, cambiarEstado);

export default router;