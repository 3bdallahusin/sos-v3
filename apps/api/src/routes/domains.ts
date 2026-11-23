import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import { CreateUserDomainSchema, CreateUserTopicSchema } from '@sos/contracts';
import { randomUUID } from 'node:crypto';

interface UserDomainRow {
  id: string;
  user_id: string;
  name: string;
  color_token: string;
  created_at: Date;
}

interface UserTopicRow {
  id: string;
  user_id: string;
  domain_id: string;
  name: string;
  created_at: Date;
}

export const domainRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // GET /api/domains - Returns all domains with nested topics
  server.get('/api/domains', async (_request, reply) => {
    const domainRows = await sql<UserDomainRow[]>`
      SELECT * FROM user_domains
      WHERE user_id = 'default-user'
      ORDER BY name ASC
    `;

    const topicRows = await sql<UserTopicRow[]>`
      SELECT * FROM user_topics
      WHERE user_id = 'default-user'
      ORDER BY name ASC
    `;

    const topicMap = new Map<string, any[]>();
    for (const t of topicRows) {
      if (!topicMap.has(t.domain_id)) {
        topicMap.set(t.domain_id, []);
      }
      topicMap.get(t.domain_id)!.push({
        id: t.id,
        userId: t.user_id,
        domainId: t.domain_id,
        name: t.name,
        createdAt: t.created_at.toISOString()
      });
    }

    const domains = domainRows.map((d) => ({
      id: d.id,
      userId: d.user_id,
      name: d.name,
      colorToken: d.color_token,
      createdAt: d.created_at.toISOString(),
      topics: topicMap.get(d.id) || []
    }));

    return reply.status(200).send({ domains });
  });

  // POST /api/domains - Upserts domain by (user_id, LOWER(name))
  server.post('/api/domains', async (request, reply) => {
    const parse = CreateUserDomainSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parse.error.format()
      });
    }

    const { name, colorToken } = parse.data;
    const trimmed = name.trim();

    // Check if already exists case-insensitively
    const existing = await sql<UserDomainRow[]>`
      SELECT * FROM user_domains
      WHERE user_id = 'default-user' AND LOWER(name) = LOWER(${trimmed})
      LIMIT 1
    `;

    if (existing.length > 0) {
      const d = existing[0];
      return reply.status(200).send({
        domain: {
          id: d.id,
          userId: d.user_id,
          name: d.name,
          colorToken: d.color_token,
          createdAt: d.created_at.toISOString()
        }
      });
    }

    const id = `domain-${randomUUID()}`;
    const token = colorToken || '#60A5FA';

    const [inserted] = await sql<UserDomainRow[]>`
      INSERT INTO user_domains (id, user_id, name, color_token, created_at)
      VALUES (${id}, 'default-user', ${trimmed}, ${token}, NOW())
      RETURNING *
    `;

    return reply.status(201).send({
      domain: {
        id: inserted.id,
        userId: inserted.user_id,
        name: inserted.name,
        colorToken: inserted.color_token,
        createdAt: inserted.created_at.toISOString()
      }
    });
  });

  // POST /api/domains/:domainId/topics - Creates or finds topic under domain
  server.post<{
    Params: { domainId: string };
  }>('/api/domains/:domainId/topics', async (request, reply) => {
    const { domainId } = request.params;
    const parse = CreateUserTopicSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parse.error.format()
      });
    }

    const { name } = parse.data;
    const trimmed = name.trim();

    // Check if domain exists
    const domainCheck = await sql<UserDomainRow[]>`
      SELECT id FROM user_domains
      WHERE id = ${domainId} AND user_id = 'default-user'
    `;

    if (domainCheck.length === 0) {
      return reply.status(404).send({ error: 'Domain not found' });
    }

    const existing = await sql<UserTopicRow[]>`
      SELECT * FROM user_topics
      WHERE user_id = 'default-user' AND domain_id = ${domainId} AND LOWER(name) = LOWER(${trimmed})
      LIMIT 1
    `;

    if (existing.length > 0) {
      const t = existing[0];
      return reply.status(200).send({
        topic: {
          id: t.id,
          userId: t.user_id,
          domainId: t.domain_id,
          name: t.name,
          createdAt: t.created_at.toISOString()
        }
      });
    }

    const id = `topic-${randomUUID()}`;
    const [inserted] = await sql<UserTopicRow[]>`
      INSERT INTO user_topics (id, user_id, domain_id, name, created_at)
      VALUES (${id}, 'default-user', ${domainId}, ${trimmed}, NOW())
      RETURNING *
    `;

    return reply.status(201).send({
      topic: {
        id: inserted.id,
        userId: inserted.user_id,
        domainId: inserted.domain_id,
        name: inserted.name,
        createdAt: inserted.created_at.toISOString()
      }
    });
  });
};
