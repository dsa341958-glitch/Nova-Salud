import { logger } from '../utils/logger.js';

export function noEncontrado(req, res) {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
}

export function manejarErrores(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) logger.error(err);
  res.status(status).json({
    ok: false,
    message: status === 500 ? 'Error interno del servidor' : err.message,
  });
}