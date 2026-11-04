import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { alertasRepository as repo } from './alertas.repository.js';

let ejecutando = false;   // evita que dos ejecuciones simultáneas creen alertas duplicadas

export const alertasService = {
  async generar() {
    if (ejecutando) return null;
    ejecutando = true;
    try {
      const dias = env.alertas.diasVencimiento;

      // 1) Cerrar lo que ya se resolvió
      const cerradas =
        (await repo.cerrarStockBajo()) + (await repo.cerrarSinStock()) +
        (await repo.cerrarPorVencer(dias)) + (await repo.cerrarVencidos());

      // 2) Crear lo nuevo
      const nuevas = {
        SIN_STOCK: await repo.crearSinStock(),
        STOCK_BAJO: await repo.crearStockBajo(),
        POR_VENCER: await repo.crearPorVencer(dias),
        VENCIDO: await repo.crearVencidos(),
      };
      return { nuevas, cerradas };
    } finally {
      ejecutando = false;
    }
  },

  // Para llamar después de ventas, compras y ajustes: no espera ni rompe la respuesta si falla
  refrescar() {
    alertasService.generar().catch((e) => logger.error('Error al refrescar alertas', e));
  },
};