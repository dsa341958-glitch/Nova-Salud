import { pool } from '../../config/db.js';

// Rango de fechas. Si desde/hasta vienen null, usa los últimos 30 días
const rango = (col) =>
  `${col} >= COALESCE(?, DATE_SUB(CURDATE(), INTERVAL 29 DAY))
   AND ${col} < DATE_ADD(COALESCE(?, CURDATE()), INTERVAL 1 DAY)`;

// Tiempo de atención en segundos
const T = 'TIMESTAMPDIFF(SECOND, v.fecha_inicio_atencion, v.fecha)';

export const reportesRepository = {
  async dashboard() {
    const resumenVentas = (condicion) => pool.query(
      `SELECT COUNT(*) AS ventas, COALESCE(SUM(v.total), 0) AS total,
              COALESCE(ROUND(AVG(NULLIF(${T}, 0))), 0) AS tiempo_promedio_seg
       FROM ventas v WHERE v.estado = 'COMPLETADA' AND ${condicion}`);

    const [
      [[hoy]], [[mes]], [[bajoStock]], [[porVencer]], [[alertas]], [ultimos7],
    ] = await Promise.all([
      resumenVentas('v.fecha >= CURDATE() AND v.fecha < DATE_ADD(CURDATE(), INTERVAL 1 DAY)'),
      resumenVentas("v.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"),
      pool.query('SELECT COUNT(*) AS cantidad FROM v_productos_bajo_stock'),
      pool.query('SELECT COUNT(*) AS cantidad FROM v_lotes_por_vencer WHERE dias_restantes > 0'),
      pool.query("SELECT COUNT(*) AS cantidad FROM alertas WHERE estado <> 'ATENDIDA'"),
      pool.query(
        `SELECT DATE(v.fecha) AS dia, COUNT(*) AS cantidad, SUM(v.total) AS total
         FROM ventas v
         WHERE v.estado = 'COMPLETADA' AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(v.fecha) ORDER BY dia`),
    ]);

    return {
      hoy, mes,
      productosBajoStock: bajoStock.cantidad,
      lotesPorVencer: porVencer.cantidad,
      alertasActivas: alertas.cantidad,
      ultimos7Dias: ultimos7,
    };
  },

  async ventas({ desde, hasta }) {
    const p = [desde, hasta];
    const [[resumen]] = await pool.query(
      `SELECT COUNT(*) AS ventas, COALESCE(SUM(v.total), 0) AS total,
              COALESCE(ROUND(AVG(v.total), 2), 0) AS ticket_promedio
       FROM ventas v WHERE v.estado = 'COMPLETADA' AND ${rango('v.fecha')}`, p);
    const [[anuladas]] = await pool.query(
      `SELECT COUNT(*) AS cantidad FROM ventas v WHERE v.estado = 'ANULADA' AND ${rango('v.fecha')}`, p);
    const [porDia] = await pool.query(
      `SELECT DATE(v.fecha) AS dia, COUNT(*) AS cantidad, SUM(v.total) AS total,
              ROUND(AVG(v.total), 2) AS ticket_promedio
       FROM ventas v WHERE v.estado = 'COMPLETADA' AND ${rango('v.fecha')}
       GROUP BY DATE(v.fecha) ORDER BY dia`, p);
    const [porMetodo] = await pool.query(
      `SELECT v.metodo_pago, COUNT(*) AS cantidad, SUM(v.total) AS total
       FROM ventas v WHERE v.estado = 'COMPLETADA' AND ${rango('v.fecha')}
       GROUP BY v.metodo_pago ORDER BY total DESC`, p);
    return { resumen, anuladas: anuladas.cantidad, porDia, porMetodo };
  },

  async masVendidos({ desde, hasta, limite }) {
    const [rows] = await pool.query(
      `SELECT p.id AS producto_id, p.nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
       FROM detalle_ventas d
       JOIN ventas v ON v.id = d.venta_id
       JOIN productos p ON p.id = d.producto_id
       WHERE v.estado = 'COMPLETADA' AND ${rango('v.fecha')}
       GROUP BY p.id, p.nombre ORDER BY unidades DESC, ingresos DESC LIMIT ?`,
      [desde, hasta, limite]);
    return rows;
  },

  // Solo cuenta ventas con duración registrada (> 0 segundos)
  async tiempoAtencion({ desde, hasta, meta }) {
    const base = `FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
                  WHERE v.estado = 'COMPLETADA' AND ${T} > 0 AND ${rango('v.fecha')}`;
    const p = [desde, hasta];

    const [[resumen]] = await pool.query(
      `SELECT COUNT(*) AS ventas_medidas,
              COALESCE(ROUND(AVG(${T})), 0) AS promedio_seg,
              COALESCE(MIN(${T}), 0) AS minimo_seg,
              COALESCE(MAX(${T}), 0) AS maximo_seg,
              COALESCE(ROUND(100 * SUM(${T} <= ?) / NULLIF(COUNT(*), 0), 1), 0) AS pct_dentro_meta
       ${base}`, [meta, ...p]);
    const [porCajero] = await pool.query(
      `SELECT CONCAT(u.nombres, ' ', u.apellidos) AS cajero, COUNT(*) AS ventas,
              ROUND(AVG(${T})) AS promedio_seg
       ${base} GROUP BY u.id, u.nombres, u.apellidos ORDER BY promedio_seg`, p);
    const [porDia] = await pool.query(
      `SELECT DATE(v.fecha) AS dia, COUNT(*) AS ventas, ROUND(AVG(${T})) AS promedio_seg
       ${base} GROUP BY DATE(v.fecha) ORDER BY dia`, p);
    return { resumen, porCajero, porDia };
  },

  async inventario({ desde, hasta }) {
    const p = [desde, hasta];
    const [[valor]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN fecha_vencimiento > CURDATE() THEN stock_actual * costo_unitario END), 0) AS valor_vigente,
              COALESCE(SUM(CASE WHEN fecha_vencimiento <= CURDATE() THEN stock_actual * costo_unitario END), 0) AS valor_vencido
       FROM lotes WHERE activo = 1 AND stock_actual > 0`);
    const [movimientos] = await pool.query(
      `SELECT m.tipo, COUNT(*) AS movimientos, SUM(ABS(m.cantidad)) AS unidades
       FROM movimientos_inventario m WHERE ${rango('m.fecha')} GROUP BY m.tipo`, p);
    const [[mermas]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(m.cantidad)), 0) AS unidades,
              COALESCE(SUM(ABS(m.cantidad) * l.costo_unitario), 0) AS valor
       FROM movimientos_inventario m JOIN lotes l ON l.id = m.lote_id
       WHERE m.tipo = 'MERMA_VENCIMIENTO' AND ${rango('m.fecha')}`, p);
    const [[ajustes]] = await pool.query(
      `SELECT COUNT(*) AS cantidad FROM movimientos_inventario m
       WHERE m.tipo IN ('AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO') AND m.referencia LIKE 'AJUSTE-LOTE-%'
         AND ${rango('m.fecha')}`, p);
    const [[quiebres]] = await pool.query(
      `SELECT COUNT(*) AS cantidad FROM alertas
       WHERE tipo = 'SIN_STOCK' AND ${rango('creada_en')}`, p);
    return { valor, movimientos, mermas, ajustesManuales: ajustes.cantidad, quiebres: quiebres.cantidad };
  },

  async reposicion() {
    const [rows] = await pool.query(
      `SELECT s.producto_id, s.nombre, s.stock_total, s.stock_minimo,
              GREATEST(s.stock_minimo * 2 - s.stock_total, 0) AS cantidad_sugerida
       FROM v_productos_bajo_stock s ORDER BY s.stock_total, s.nombre`);
    return rows;
  },
};