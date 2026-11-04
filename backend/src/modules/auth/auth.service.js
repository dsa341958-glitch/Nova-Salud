import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/helpers.js';
import { usuariosRepository as repo } from '../usuarios/usuarios.repository.js';

export const authService = {
  async login(email, password, ip) {
    const user = await repo.buscarPorEmail(email);

    // Mismo mensaje para "no existe", "inactivo" y "clave mala": no damos pistas a atacantes
    const credencialesOk = user && user.activo && (await bcrypt.compare(password, user.password_hash));
    if (!credencialesOk) {
      await repo.auditar({ usuarioId: user?.id ?? null, accion: 'LOGIN_FALLIDO', detalle: { email }, ip });
      throw new HttpError(401, 'Correo o contraseña incorrectos');
    }

    await repo.registrarAcceso(user.id);
    await repo.auditar({ usuarioId: user.id, accion: 'LOGIN', ip });

    const nombre = `${user.nombres} ${user.apellidos}`;
    const token = jwt.sign({ id: user.id, rol: user.rol, nombre }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    return { token, usuario: { id: user.id, nombre, email: user.email, rol: user.rol } };
  },

  async perfil(id) {
    const user = await repo.buscarPorId(id);
    if (!user || !user.activo) throw new HttpError(401, 'Usuario no disponible');
    return user;
  },
};