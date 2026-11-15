import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { checkDatabaseConnection } from './db.js';
import type { HealthResponse, ReadinessResponse } from '@sos/contracts';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  });

  // Security headers via Helmet
  await server.register(helmet, {
    contentSecurityPolicy: false // Allows local development and client embedding
  });

  // Local development CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Health endpoint: Liveness probe
  server.get<{ Reply: HealthResponse }>('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: process.uptime()
    });
  });

  // Readiness endpoint: Checks PostgreSQL connection to dedicated sos_v3_dev database
  server.get<{ Reply: ReadinessResponse }>('/ready', async (_req, reply) => {
    const dbCheck = await checkDatabaseConnection();

    if (dbCheck.connected) {
      return reply.status(200).send({
        status: 'ready',
        database: 'connected',
        databaseName: dbCheck.databaseName,
        databaseUser: dbCheck.databaseUser,
        timestamp: new Date().toISOString()
      });
    }

    return reply.status(503).send({
      status: 'not_ready',
      database: 'disconnected',
      error: dbCheck.error,
      timestamp: new Date().toISOString()
    });
  });

  return server;
}
