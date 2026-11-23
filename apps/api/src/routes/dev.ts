import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import { seedRealisticData } from '../seed-realistic.js';

export const devRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // POST /api/dev/reseed - Idempotently seeds realistic academic data
  server.post('/api/dev/reseed', async (_request, reply) => {
    try {
      const result = await seedRealisticData(sql);
      return reply.status(200).send(result);
    } catch (err: unknown) {
      server.log.error(err, 'Failed to reseed database');
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(500).send({ error: 'Reseed Failed', message: msg });
    }
  });

  // POST /api/dev/clean-test-sessions - Deletes temporary sessions matching test titles
  server.post('/api/dev/clean-test-sessions', async (_request, reply) => {
    try {
      await sql`
        DELETE FROM study_sessions
        WHERE user_id = 'default-user'
          AND (
            title LIKE 'E2E%'
            OR title LIKE 'Overlap_%'
            OR title LIKE 'Adhoc Deep Work%'
            OR title LIKE 'Test%'
            OR title LIKE 'Neuroscience_%'
          )
      `;
      await sql`
        DELETE FROM user_domains
        WHERE user_id = 'default-user' AND name LIKE 'Neuroscience_%'
      `;
      return reply.status(200).send({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(500).send({ error: 'Clean Failed', message: msg });
    }
  });
};
