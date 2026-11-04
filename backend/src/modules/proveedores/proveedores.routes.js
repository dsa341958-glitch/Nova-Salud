import { Router } from 'express';
import { body, param } from 'express-validator';
import { listar, obtener, crear, actualizar, cambiarEstado } from './proveedores.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();
const puedeEditar = permitirRoles('ADMIN', 'FARMACEUTICO');

const reglas = [
  body('razonSocial').trim().notEmpty().withMessage('La razón social es obligatoria').isLength({ max: 150 }),
  body('ruc').trim().isNumeric().isLength({ min: 11, max: 11 }).withMessage('El RUC debe tener 11 dígitos'),
  body('telefono').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Correo inválido'),
  body('direccion').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }),
];

router.use(autenticar);
router.get('/', listar);
router.get('/:id', param('id').isInt({ min: 1 }), validar, obtener);
router.post('/', puedeEditar, reglas, validar, crear);
router.put('/:id', puedeEditar, param('id').isInt({ min: 1 }), reglas, validar, actualizar);
router.patch('/:id/estado', puedeEditar,
  param('id').isInt({ min: 1 }),
  body('activo').isBoolean().toBoolean(),
  validar, cambiarEstado);

export default router;