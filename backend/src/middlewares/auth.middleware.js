import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/helpers.js';

export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token no proporcionado'));
  }
  try {
    req.user = jwt.verify(token, env.jwtSecret);   // { id, rol, nombre }
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}