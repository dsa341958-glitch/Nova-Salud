import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, me } from './auth.controller.js';
import { validar } from '../../middlewares/validate.middleware.js';
import { autenticar } from '../../middlewares/auth.middleware.js';

const router = Router();

// Máximo 10 intentos de login cada 15 minutos por IP (frena fuerza bruta)
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

router.post(
  '/login',
  limitadorLogin,
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria'),
  validar,
  login
);

router.get('/me', autenticar, me);

export default router;