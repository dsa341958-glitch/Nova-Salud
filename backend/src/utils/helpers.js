export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Evita escribir try/catch en cada controlador
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const paginar = (query) => ({
  pagina: Math.max(Number(query.pagina) || 1, 1),
  limite: Math.min(Math.max(Number(query.limite) || 20, 1), 100),
});