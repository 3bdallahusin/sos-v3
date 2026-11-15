import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { type FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { closeDatabaseConnection } from '../src/db.js';

describe('Fastify API Foundation (Phase 01)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabaseConnection();
  });

  it('GET /health returns 200 OK with status "ok"', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /ready connects to dedicated sos_v3_dev database using sos_v3_app role', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ready');
    expect(body.database).toBe('connected');
    expect(body.databaseName).toBe('sos_v3_dev');
    expect(body.databaseUser).toBe('sos_v3_app');
  });
});
