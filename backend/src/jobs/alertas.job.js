import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { alertasService } from '../modules/alertas/alertas.service.js';

async function revisar(origen) {
  try {
    const r = await alertasService.generar();
    if (r) logger.info(`Alertas (${origen}): nuevas`, JSON.stringify(r.nuevas), `| cerradas: ${r.cerradas}`);
  } catch (err) {
    logger.error('Error en la revisión de alertas', err);
  }
}

export function iniciarJobAlertas() {
  if (!cron.validate(env.alertas.cron)) {
    logger.warn(`ALERTAS_CRON inválido ("${env.alertas.cron}"). El job no se inició.`);
    return;
  }
  revisar('arranque');
  cron.schedule(env.alertas.cron, () => revisar('programado'), { timezone: 'America/Lima' });
  logger.info(`Job de alertas programado: ${env.alertas.cron}`);
}