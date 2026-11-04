import { Router } from 'express';
import { body, param } from 'express-validator';
import { listar, crear, cambiarEstado } from './usuarios.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();

router.use(autenticar, permitirRoles('ADMIN'));   // todo este módulo es solo para ADMIN

router.get('/', listar);

router.post(
  '/',
  body('nombres').trim().notEmpty().withMessage('Nombres obligatorios'),
  body('apellidos').trim().notEmpty().withMessage('Apellidos obligatorios'),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
  body('rol').isIn(['ADMIN', 'FARMACEUTICO', 'CAJERO']).withMessage('Rol inválido'),
  validar,
  crear
);

router.patch(
  '/:id/estado',
  param('id').isInt({ min: 1 }),
  body('activo').isBoolean().withMessage('"activo" debe ser true o false').toBoolean(),
  validar,
  cambiarEstado
);

export default router;