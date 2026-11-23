import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { checkDatabaseConnection } from './db.js';
import { profileRoutes } from './routes/profile.js';
import { settingsRoutes } from './routes/settings.js';
import { learningRoutes } from './routes/learning.js';
import { calendarRoutes } from './routes/calendar.js';
import { libraryRoutes } from './routes/library.js';
import { domainRoutes } from './routes/domains.js';
import { studySessionRoutes } from './routes/study-sessions.js';
import { trackingRoutes } from './routes/tracking.js';
import { devRoutes } from './routes/dev.js';
import { initializeDatabase } from './db-init.js';
import type { HealthResponse, ReadinessResponse } from '@sos/contracts';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  });

  // Initialize Learning Database Tables & Seeds
  try {
    await initializeDatabase();
  } catch (initErr) {
    server.log.warn({ err: initErr }, 'Database tables initialization notice');
  }

  // Security headers via Helmet
  await server.register(helmet, {
    contentSecurityPolicy: false // Allows local development and client embedding
  });

  // Local development CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Multipart form data support for file uploads (100 MB limit)
  await server.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024,
      fieldSize: 10 * 1024 * 1024,
      files: 10
    }
  });

  // Global Fastify error handler to prevent unhandled route errors from crashing the process
  server.setErrorHandler((error: any, _request, reply) => {
    server.log.error(error);
    const statusCode = error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;
    return reply.status(statusCode).send({
      error: error?.message || 'Internal Server Error',
      statusCode
    });
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

  server.get<{ Reply: HealthResponse }>('/api/health', async (_req, reply) => {
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

  server.get<{ Reply: ReadinessResponse }>('/api/ready', async (_req, reply) => {
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

  // Register Profile & Social Graph API Routes
  await server.register(profileRoutes);

  // Register Settings & AI Skills API Routes
  await server.register(settingsRoutes);

  // Register Learning Workspace API Routes
  await server.register(learningRoutes);

  // Register Calendar & Learning Blocks API Routes
  await server.register(calendarRoutes);

  // Register Library File & Folder Management API Routes
  await server.register(libraryRoutes);

  // Register User Domains & Topics API Routes
  await server.register(domainRoutes);

  // Register Unified Study Sessions API Routes
  await server.register(studySessionRoutes);

  // Register Tracking Analytics & Heatmap API Routes
  await server.register(trackingRoutes);

  // Register Development & Realistic Seeding API Routes
  await server.register(devRoutes);

  return server;
}
