import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { iniciarJobAlertas } from './jobs/alertas.job.js';

app.listen(env.port, () => {
  logger.info(`API escuchando en el puerto ${env.port}`);
  iniciarJobAlertas();
});

