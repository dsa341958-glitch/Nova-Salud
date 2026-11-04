import { authService } from './auth.service.js';
import { asyncHandler } from '../../utils/helpers.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password, req.ip);
  res.json({ ok: true, ...data });
});

export const me = asyncHandler(async (req, res) => {
  const usuario = await authService.perfil(req.user.id);
  res.json({ ok: true, usuario });
});