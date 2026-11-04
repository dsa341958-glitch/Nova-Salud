import { HttpError } from '../utils/helpers.js';

// Uso: permitirRoles('ADMIN', 'FARMACEUTICO')
export const permitirRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return next(new HttpError(403, 'No tienes permisos para esta acción'));
  }
  next();
};