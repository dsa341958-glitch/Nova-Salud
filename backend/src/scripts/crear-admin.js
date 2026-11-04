import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const [email, password] = process.argv.slice(2);

if (!email || !password || password.length < 8) {
  console.error('Uso: node src/scripts/crear-admin.js <correo> <contraseña de mínimo 8 caracteres>');
  process.exit(1);
}

const [[rol]] = await pool.query("SELECT id FROM roles WHERE nombre = 'ADMIN'");
const [[existe]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

if (existe) {
  console.log('Ya existe un usuario con ese correo.');
} else {
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  await pool.query(
    'INSERT INTO usuarios (rol_id, nombres, apellidos, email, password_hash) VALUES (?, ?, ?, ?, ?)',
    [rol.id, 'Administrador', 'Nova Salud', email, hash]
  );
  console.log(`Administrador creado: ${email}`);
}
await pool.end();