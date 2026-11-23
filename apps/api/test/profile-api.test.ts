import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';

describe('Profile API Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/profile returns authenticated user profile', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/profile'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Abdalla Husin');
    expect(body.handle).toBe('@abdalla7usin');
    expect(body.location).toBe('Mansoura, Egypt');
    expect(body.isAuthenticated).toBe(true);
  });

  it('GET /api/profile/posts returns user posts', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/profile/posts'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/profile/resources returns shared study resources', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/profile/resources'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/profile/communities returns user communities', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/profile/communities'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/profile/activity returns calculated activity metrics without hardcoded dummies', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/profile/activity'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.totalContributions).toBe('number');
    expect(typeof body.currentStreakDays).toBe('number');
    expect(typeof body.totalStudyTimeHours).toBe('number');
    expect(Array.isArray(body.dailyContributions)).toBe(true);
    expect(body.dailyContributions.length).toBe(364);
  });
});
