import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';

describe('Calendar API Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/calendar/blocks returns learning blocks with duration and summary metrics', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/calendar/blocks'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.blocks.length).toBeGreaterThan(0);
    expect(body.summary.totalMinutes).toBeGreaterThan(0);
    expect(body.summary.formattedDuration).toBeDefined();
    expect(body.summary.blockCount).toBe(body.blocks.length);

    // Verify date range query with first returned block date
    const firstDate = body.blocks[0].date;
    const dateRangeRes = await server.inject({
      method: 'GET',
      url: `/api/calendar/blocks?start=${firstDate}&end=${firstDate}`
    });
    expect(dateRangeRes.statusCode).toBe(200);
    const dateRangeBody = JSON.parse(dateRangeRes.body);
    expect(dateRangeBody.blocks.length).toBeGreaterThanOrEqual(1);
    expect(dateRangeBody.summary.totalMinutes).toBeGreaterThan(0);
  });

  it('GET /api/calendar/blocks returns all seeded blocks across November 2026', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/calendar/blocks?start=2026-11-01&end=2026-11-30'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.blocks.length).toBeGreaterThanOrEqual(20);
    expect(body.summary.blockCount).toBeGreaterThanOrEqual(20);
    expect(body.summary.totalMinutes).toBeGreaterThan(0);
  });

  it('POST /api/calendar/blocks creates a new learning block and calculates duration', async () => {
    const newBlockPayload = {
      title: 'Neural Networks & Deep Learning Foundations',
      domain: 'Computer Science',
      topic: 'Machine Learning',
      date: '2026-11-19',
      startTime: '18:00',
      endTime: '19:30'
    };

    const res = await server.inject({
      method: 'POST',
      url: '/api/calendar/blocks',
      payload: newBlockPayload
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.block.id).toBeDefined();
    expect(body.block.title).toBe(newBlockPayload.title);
    expect(body.block.domain).toBe(newBlockPayload.domain);
    expect(body.block.durationMinutes).toBe(90);

    const createdId = body.block.id;

    // PATCH block
    const patchRes = await server.inject({
      method: 'PATCH',
      url: `/api/calendar/blocks/${createdId}`,
      payload: {
        startTime: '18:00',
        endTime: '20:00',
        title: 'Neural Networks & Deep Learning Foundations (Advanced)'
      }
    });

    expect(patchRes.statusCode).toBe(200);
    const patchedBody = JSON.parse(patchRes.body);
    expect(patchedBody.block.durationMinutes).toBe(120);
    expect(patchedBody.block.title).toBe('Neural Networks & Deep Learning Foundations (Advanced)');

    // DELETE block
    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/api/calendar/blocks/${createdId}`
    });

    expect(deleteRes.statusCode).toBe(200);
    const deleteBody = JSON.parse(deleteRes.body);
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.id).toBe(createdId);
  });
});
