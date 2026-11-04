import { Router } from 'express';
import { body, param } from 'express-validator';
import { listar, buscar, obtener, crear, actualizar, cambiarEstado } from './clientes.controller.js';
import { autenticar } from '../../middlewares/auth.middleware.js';
import { permitirRoles } from '../../middlewares/roles.middleware.js';
import { validar } from '../../middlewares/validate.middleware.js';

const router = Router();

const reglas = [
  body('tipoDocumento').isIn(['DNI', 'RUC', 'CE', 'OTRO']).withMessage('Tipo de documento inválido'),
  body('nroDocumento').trim().custom((valor, { req }) => {
    const tipo = req.body.tipoDocumento;
    if (tipo === 'DNI' && !/^\d{8}$/.test(valor)) throw new Error('El DNI debe tener 8 dígitos');
    if (tipo === 'RUC' && !/^\d{11}$/.test(valor)) throw new Error('El RUC debe tener 11 dígitos');
    if ((tipo === 'CE' || tipo === 'OTRO') && !/^[A-Za-z0-9]{5,15}$/.test(valor)) {
      throw new Error('Documento inválido (5 a 15 caracteres alfanuméricos)');
    }
    return true;
  }),
  body('nombres').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 150 }),
  body('telefono').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Correo inválido'),
];

router.use(autenticar);

// /buscar va ANTES de /:id. El cajero puede registrar clientes en el mostrador.
router.get('/buscar', buscar);
router.get('/', listar);
router.get('/:id', param('id').isInt({ min: 1 }), validar, obtener);
router.post('/', reglas, validar, crear);
router.put('/:id', param('id').isInt({ min: 1 }), reglas, validar, actualizar);
router.patch('/:id/estado', permitirRoles('ADMIN', 'FARMACEUTICO'),
  param('id').isInt({ min: 1 }),
  body('activo').isBoolean().toBoolean(),
  validar, cambiarEstado);

export default router;