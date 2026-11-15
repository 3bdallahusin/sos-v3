import { buildServer } from './server.js';
import { getConfig } from './config.js';
import { closeDatabaseConnection } from './db.js';

async function main() {
  const config = getConfig();
  const server = await buildServer();

  const shutdown = async () => {
    server.log.info('Shutting down API server...');
    await server.close();
    await closeDatabaseConnection();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.listen({
      port: config.API_PORT,
      host: config.HOST
    });
    server.log.info(`SOS V3 API listening on http://${config.HOST}:${config.API_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
