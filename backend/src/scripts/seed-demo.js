import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { comprasService } from '../modules/compras/compras.service.js';
import { ventasService } from '../modules/ventas/ventas.service.js';
import { alertasService } from '../modules/alertas/alertas.service.js';

const CLAVE = 'DemoClave123';
const IP = '127.0.0.1';

// Fecha AAAA-MM-DD en hora de Lima, desplazada n días
const enDias = (n) =>
  new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

let semilla = 7;
const rnd = (n) => { semilla = (semilla * 9301 + 49297) % 233280; return Math.floor((semilla / 233280) * n); };

const q = async (sql, p = []) => (await pool.query(sql, p))[0];

// ---------- Seguridad: solo corre sobre una base sin movimientos ----------
const [{ n: hayDatos }] = await q(
  'SELECT (SELECT COUNT(*) FROM productos) + (SELECT COUNT(*) FROM ventas) + (SELECT COUNT(*) FROM compras) AS n');
if (hayDatos > 0) {
  console.error('La base ya tiene productos, compras o ventas. Para cargar la demo reinicia la base: docker compose down -v');
  await pool.end();
  process.exit(1);
}

// ---------- Usuarios ----------
async function usuario(email, nombres, apellidos, rol) {
  const [u] = await q('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (u) return u.id;
  const [{ id: rolId }] = await q('SELECT id FROM roles WHERE nombre = ?', [rol]);
  const hash = await bcrypt.hash(CLAVE, env.bcryptRounds);
  const r = await q(
    'INSERT INTO usuarios (rol_id, nombres, apellidos, email, password_hash) VALUES (?, ?, ?, ?, ?)',
    [rolId, nombres, apellidos, email, hash]);
  return r.insertId;
}
const adminId = await usuario('admin@novasalud.com', 'Administrador', 'Nova Salud', 'ADMIN');
await usuario('farmaceutico@novasalud.com', 'Luis', 'Paredes', 'FARMACEUTICO');
const anaId = await usuario('ana@novasalud.com', 'Ana', 'Perez', 'CAJERO');
const luisId = await usuario('cajero2@novasalud.com', 'Pedro', 'Salas', 'CAJERO');

// ---------- Proveedores ----------
const prov = [];
for (const [rs, ruc, tel] of [
  ['Distribuidora Médica SAC', '20123456789', '987654321'],
  ['Droguería Perú Salud SAC', '20456789012', '986123456'],
]) prov.push((await q('INSERT INTO proveedores (razon_social, ruc, telefono) VALUES (?, ?, ?)', [rs, ruc, tel])).insertId);

// ---------- Clientes ----------
const clientes = [];
for (const [tipo, doc, nom, tel] of [
  ['DNI', '40123456', 'María Torres Díaz', '999888777'],
  ['DNI', '45678912', 'Carlos Ramos Vega', '988777666'],
  ['DNI', '70234561', 'Rosa Huamán Flores', null],
  ['RUC', '20512345678', 'Clínica San Martín SAC', '014567890'],
]) clientes.push({ id: (await q('INSERT INTO clientes (tipo_documento, nro_documento, nombres, telefono) VALUES (?, ?, ?, ?)', [tipo, doc, nom, tel])).insertId, tipo });

// ---------- Productos (categorías del seed: ids por orden) ----------
const cats = (await q('SELECT id FROM categorias ORDER BY id LIMIT 5')).map((c) => c.id);
const catalogo = [
  // [cat, barras, nombre, principio, lab, presentación, receta, precio, mínimo]
  [0, '7750001000011', 'Paracetamol 500 mg x 100', 'Paracetamol', 'Genfar', 'Caja x 100 tabletas', 0, 12.5, 10],
  [0, '7750001000028', 'Ibuprofeno 400 mg x 20', 'Ibuprofeno', 'Portugal', 'Caja x 20 tabletas', 0, 8.9, 15],
  [0, '7750001000035', 'Naproxeno 550 mg x 10', 'Naproxeno', 'Genfar', 'Caja x 10 tabletas', 0, 6.5, 10],
  [1, '7750001000042', 'Amoxicilina 500 mg x 21', 'Amoxicilina', 'Medifarma', 'Caja x 21 cápsulas', 1, 18, 10],
  [1, '7750001000059', 'Azitromicina 500 mg x 3', 'Azitromicina', 'Farmindustria', 'Caja x 3 tabletas', 1, 15.5, 8],
  [2, '7750001000066', 'Antigripal x 24', 'Paracetamol + Clorfenamina', 'GSK', 'Caja x 24 tabletas', 0, 14.2, 12],
  [2, '7750001000073', 'Loratadina 10 mg x 10', 'Loratadina', 'Genfar', 'Caja x 10 tabletas', 0, 5.8, 10],
  [3, '7750001000080', 'Vitamina C 1 g x 10', 'Ácido ascórbico', 'Bayer', 'Tubo x 10 efervescentes', 0, 9.9, 10],
  [3, '7750001000097', 'Complejo B x 30', 'Vitaminas del complejo B', 'Medifarma', 'Frasco x 30 tabletas', 0, 22, 6],
  [4, '7750001000103', 'Alcohol medicinal 70% 250 ml', null, 'Quimica Suiza', 'Frasco 250 ml', 0, 4.5, 20],
  [4, '7750001000110', 'Mascarillas descartables x 50', null, 'Protex', 'Caja x 50 unidades', 0, 16, 5],
  [2, '7750001000127', 'Jarabe para la tos 120 ml', 'Ambroxol', 'Portugal', 'Frasco 120 ml', 0, 11.3, 8],
  [0, '7750001000134', 'Diclofenaco gel 1% 30 g', 'Diclofenaco', 'Genfar', 'Tubo 30 g', 0, 7.4, 10],
];
const P = [];
for (const c of catalogo) {
  const id = (await q(
    `INSERT INTO productos (categoria_id, codigo_barras, nombre, principio_activo, laboratorio, presentacion, requiere_receta, precio_venta, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cats[c[0]], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8]])).insertId;
  P.push({ id, receta: !!c[6] });
}

// ---------- Compras (crean lotes, detalle y kardex) ----------
const it = (i, lote, dias, cantidad, costo) =>
  ({ productoId: P[i].id, codigoLote: lote, fechaVencimiento: enDias(dias), cantidad, costoUnitario: costo });

const compraIds = [];
compraIds.push(await comprasService.registrar({ proveedorId: prov[0], nroDocumento: 'F001-2001', items: [
  it(0, 'PAR-2601', 520, 100, 8.2), it(1, 'IBU-2601', 480, 80, 5.5), it(2, 'NAP-2601', 450, 60, 3.9),
  it(3, 'AMO-2601', 300, 50, 11.5), it(4, 'AZI-2601', 330, 30, 9.8), it(5, 'ANT-2601', 400, 60, 9.0),
] }, adminId, IP));
compraIds.push(await comprasService.registrar({ proveedorId: prov[1], nroDocumento: 'F002-0450', items: [
  it(6, 'LOR-2601', 420, 40, 3.2), it(6, 'LOR-VIEJO', 200, 10, 3.0), it(7, 'VTC-2601', 380, 70, 6.0),
  it(8, 'CPB-2601', 360, 6, 14.0), it(9, 'ALC-2601', 500, 100, 2.6), it(10, 'MAS-2601', 600, 5, 9.5),
  it(11, 'JAR-2601', 30, 30, 7.0),
] }, adminId, IP));
compraIds.push(await comprasService.registrar({ proveedorId: prov[0], nroDocumento: 'F001-2040', items: [
  it(0, 'PAR-2602', 140, 40, 8.0),           // vence antes que PAR-2601: demuestra FEFO
] }, adminId, IP));

// Un lote ya vencido (la API no permite registrarlos, así que se simula): genera la alerta VENCIDO
await q("UPDATE lotes SET fecha_vencimiento = DATE_SUB(CURDATE(), INTERVAL 5 DAY) WHERE codigo_lote = 'LOR-VIEJO'");

// ---------- Ventas de los últimos 7 días ----------
const vendibles = [0, 1, 2, 3, 5, 6, 7, 9, 11];
const metodos = ['EFECTIVO', 'YAPE_PLIN', 'TARJETA', 'EFECTIVO'];
const ventas = [];
for (let i = 0; i < 28; i++) {
  const elegidos = new Set();
  const nItems = 1 + rnd(3);
  while (elegidos.size < nItems) elegidos.add(vendibles[rnd(vendibles.length)]);
  const items = [...elegidos].map((idx) => ({ productoId: P[idx].id, cantidad: 1 + rnd(3) }));

  const cli = i % 4 === 0 ? clientes[(i / 4) % clientes.length] : null;
  const id = await ventasService.registrar({
    clienteId: cli?.id ?? null,
    tipoComprobante: !cli ? 'TICKET' : cli.tipo === 'RUC' ? 'FACTURA' : 'BOLETA',
    metodoPago: metodos[i % 4],
    duracionSegundos: 25 + rnd(140),
    recetaVerificada: [...elegidos].some((idx) => P[idx].receta),
    items,
  }, i % 2 === 0 ? anaId : luisId, IP);
  ventas.push({ id, dias: 6 - Math.floor(i / 4) });
}

// Dos ventas anuladas (devuelven el stock y dejan rastro en el kardex)
await ventasService.anular(ventas[5].id, 'Venta registrada por error (demo)', adminId, IP);
await ventasService.anular(ventas[12].id, 'Cliente devolvió el producto (demo)', adminId, IP);

// ---------- Repartir las fechas para que los reportes tengan historia ----------
for (const v of ventas) {
  await q('UPDATE ventas SET fecha = DATE_SUB(fecha, INTERVAL ? DAY), fecha_inicio_atencion = DATE_SUB(fecha_inicio_atencion, INTERVAL ? DAY) WHERE id = ?', [v.dias, v.dias, v.id]);
  await q("UPDATE movimientos_inventario SET fecha = DATE_SUB(fecha, INTERVAL ? DAY) WHERE referencia = ?", [v.dias, `VENTA-${v.id}`]);
}
for (const id of compraIds) {
  await q('UPDATE compras SET fecha = DATE_SUB(fecha, INTERVAL 10 DAY) WHERE id = ?', [id]);
  await q('UPDATE movimientos_inventario SET fecha = DATE_SUB(fecha, INTERVAL 10 DAY) WHERE referencia = ?', [`COMPRA-${id}`]);
}

// ---------- Alertas ----------
await alertasService.generar();

const [{ n: nAlertas }] = await q("SELECT COUNT(*) AS n FROM alertas WHERE estado <> 'ATENDIDA'");
console.log(`Demo cargada: ${P.length} productos, ${compraIds.length} compras, ${ventas.length} ventas (2 anuladas), ${nAlertas} alertas activas.`);
console.log(`Usuarios (clave ${CLAVE} para los nuevos): admin@novasalud.com*, farmaceutico@novasalud.com, ana@novasalud.com, cajero2@novasalud.com`);
console.log('* Si el admin ya existía, conserva su clave actual.');
await pool.end();