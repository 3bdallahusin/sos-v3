import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';

describe('Settings API Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/settings returns full default user settings', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/settings'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.account.name).toBe('Abdalla Husin');
    expect(body.account.username).toBe('@abdalla7usin');
    expect(body.account.plan).toBe('Free');
    expect(body.general.appLanguage).toBe('English');
    expect(body.general.horizonBar.milestoneName).toBe('Fall Semester 2026');
    expect(body.general.focusTracking.defaultPomodoroInterval).toBe('50m / 10m');
    expect(body.memory.enabled).toBe(false);
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills.length).toBeGreaterThanOrEqual(6);
  });

  it('PUT /api/settings/account updates account details and persists changes', async () => {
    const res = await server.inject({
      method: 'PUT',
      url: '/api/settings/account',
      payload: {
        learningFocus: 'Distributed Systems & Cognitive Science'
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.learningFocus).toBe('Distributed Systems & Cognitive Science');

    // Verify retrieval
    const getRes = await server.inject({
      method: 'GET',
      url: '/api/settings'
    });
    const getBody = JSON.parse(getRes.body);
    expect(getBody.account.learningFocus).toBe('Distributed Systems & Cognitive Science');
  });

  it('GET /api/settings/usage returns computed usage metrics with cycle reset calculation', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/settings/usage'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.planName).toBe('SOS Free');
    expect(body.aiCreditsLimit).toBe(500);
    expect(typeof body.aiCreditsResetDays).toBe('number');
    expect(body.storageBytesLimit).toBe(5 * 1024 * 1024 * 1024);
  });

  it('PUT /api/settings/general updates Horizon Bar and Pomodoro interval', async () => {
    const res = await server.inject({
      method: 'PUT',
      url: '/api/settings/general',
      payload: {
        focusTracking: {
          defaultPomodoroInterval: '25m / 5m',
          automaticStudyTracking: true
        }
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.focusTracking.defaultPomodoroInterval).toBe('25m / 5m');
    expect(body.focusTracking.automaticStudyTracking).toBe(true);
  });

  it('PUT /api/settings/memory updates study memory fields', async () => {
    const res = await server.inject({
      method: 'PUT',
      url: '/api/settings/memory',
      payload: {
        enabled: true,
        whoIAm: 'Computer science researcher specializing in local-first systems',
        whatIAmLearning: 'Spaced repetition algorithms and Raft consensus',
        howIPreferToLearn: 'First principles derivation with concrete diagrams'
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.enabled).toBe(true);
    expect(body.whoIAm).toContain('Computer science researcher');
  });

  it('manages Custom Skills lifecycle: list, create, toggle, update, delete', async () => {
    // 1. List skills
    const listRes = await server.inject({
      method: 'GET',
      url: '/api/settings/skills'
    });
    expect(listRes.statusCode).toBe(200);
    const initialSkills = JSON.parse(listRes.body);
    const initialCount = initialSkills.length;

    // 2. Create custom skill
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/settings/skills',
      payload: {
        command: '/deep-dive',
        description: 'Perform an exhaustive analysis of the selected concept',
        systemPrompt: 'Provide an in-depth breakdown covering historical context, mathematical foundations, and real-world edge cases.'
      }
    });
    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body);
    expect(created.command).toBe('/deep-dive');
    expect(created.isBuiltIn).toBe(false);

    // 3. Toggle skill
    const toggleRes = await server.inject({
      method: 'PUT',
      url: `/api/settings/skills/${created.id}`,
      payload: { enabled: false }
    });
    expect(toggleRes.statusCode).toBe(200);
    const toggled = JSON.parse(toggleRes.body);
    expect(toggled.enabled).toBe(false);

    // 4. Delete skill
    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/api/settings/skills/${created.id}`
    });
    expect(deleteRes.statusCode).toBe(200);

    // 5. Cannot delete built-in skill
    const deleteBuiltInRes = await server.inject({
      method: 'DELETE',
      url: '/api/settings/skills/skill-summarize'
    });
    expect(deleteBuiltInRes.statusCode).toBe(400);
  });
});
