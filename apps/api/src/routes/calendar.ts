import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import {
  CreateLearningBlockSchema,
  UpdateLearningBlockSchema,
  type LearningBlockContract,
  type CalendarBlocksResponseContract
} from '@sos/contracts';
import {
  formatCalendarDuration,
  timeStringToMinutes
} from '@sos/domain';
import { randomUUID } from 'node:crypto';

function computeDurationMinutes(start: string, end: string): number {
  const startMins = timeStringToMinutes(start);
  const endMins = timeStringToMinutes(end);
  return Math.max(0, endMins - startMins);
}

function mapRowToBlock(row: any): LearningBlockContract {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain_name,
    topic: row.topic_name ?? undefined,
    date: row.date,
    startTime: row.planned_start_time || '09:00',
    endTime: row.planned_end_time || '10:00',
    durationMinutes: Number(row.planned_duration_minutes || 0),
    status: row.status,
    seriesId: row.series_id ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

export const calendarRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // GET /api/calendar/blocks?start=YYYY-MM-DD&end=YYYY-MM-DD
  server.get<{
    Querystring: { start?: string; end?: string };
    Reply: CalendarBlocksResponseContract;
  }>('/api/calendar/blocks', async (request, reply) => {
    const { start, end } = request.query;

    let rows: any[];

    if (start && end) {
      rows = await sql`
        SELECT * FROM study_sessions
        WHERE user_id = 'default-user' AND date >= ${start} AND date <= ${end}
        ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC
      `;
    } else if (start) {
      rows = await sql`
        SELECT * FROM study_sessions
        WHERE user_id = 'default-user' AND date >= ${start}
        ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC
      `;
    } else if (end) {
      rows = await sql`
        SELECT * FROM study_sessions
        WHERE user_id = 'default-user' AND date <= ${end}
        ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC
      `;
    } else {
      rows = await sql`
        SELECT * FROM study_sessions
        WHERE user_id = 'default-user'
        ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC
      `;
    }

    const blocks = rows.map(mapRowToBlock);
    const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const formattedDuration = formatCalendarDuration(totalMinutes);

    return reply.status(200).send({
      blocks,
      summary: {
        totalMinutes,
        formattedDuration,
        blockCount: blocks.length
      }
    });
  });

  // POST /api/calendar/blocks
  server.post('/api/calendar/blocks', async (request, reply) => {
    const parseResult = CreateLearningBlockSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format()
      });
    }

    const body = parseResult.data;
    const durationMinutes = computeDurationMinutes(body.startTime, body.endTime);
    const id = `block-${randomUUID()}`;

    // Resolve or insert domain
    let domainId: string | null = null;
    const existingDomains = await sql`
      SELECT id FROM user_domains
      WHERE user_id = 'default-user' AND LOWER(name) = LOWER(${body.domain})
    `;
    if (existingDomains.length > 0) {
      domainId = existingDomains[0].id;
    } else {
      domainId = randomUUID();
      await sql`
        INSERT INTO user_domains (id, user_id, name, color_token)
        VALUES (${domainId}, 'default-user', ${body.domain}, 'accent-100')
        ON CONFLICT (user_id, name) DO NOTHING
      `;
    }

    const [inserted] = await sql`
      INSERT INTO study_sessions (
        id, user_id, title, domain_id, domain_name, topic_id, topic_name,
        status, source, date, planned_start_time, planned_end_time,
        planned_duration_minutes, actual_start_timestamp, actual_end_timestamp,
        actual_focus_seconds, actual_break_seconds, timer_mode, pause_intervals,
        notes, sort_order, series_id, recurrence_rule, is_series_exception,
        created_at, updated_at
      ) VALUES (
        ${id}, 'default-user', ${body.title}, ${domainId}, ${body.domain},
        null, ${body.topic ?? null}, 'planned', 'calendar',
        ${body.date}, ${body.startTime}, ${body.endTime},
        ${durationMinutes}, null, null, 0, 0, 'countdown',
        '[]'::jsonb, null, 0, null, null, false,
        NOW(), NOW()
      )
      RETURNING *
    `;

    const block = mapRowToBlock(inserted);
    return reply.status(201).send({ block });
  });

  // PATCH /api/calendar/blocks/:id
  server.patch<{
    Params: { id: string };
  }>('/api/calendar/blocks/:id', async (request, reply) => {
    const { id } = request.params;
    const parseResult = UpdateLearningBlockSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format()
      });
    }

    const existingRows = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;

    if (existingRows.length === 0) {
      return reply.status(404).send({ error: 'Learning block not found' });
    }

    const existing = existingRows[0];
    const data = parseResult.data;

    const title = data.title ?? existing.title;
    const domain = data.domain ?? existing.domain_name;
    const topic = data.topic !== undefined ? data.topic : existing.topic_name;
    const date = data.date ?? existing.date;
    const startTime = data.startTime ?? existing.planned_start_time;
    const endTime = data.endTime ?? existing.planned_end_time;
    const durationMinutes = computeDurationMinutes(startTime, endTime);
    const newStatus = data.status ?? existing.status;
    const actualSeconds = newStatus === 'completed' && Number(existing.actual_focus_seconds || 0) === 0
      ? durationMinutes * 60
      : Number(existing.actual_focus_seconds || 0);

    const [updated] = await sql`
      UPDATE study_sessions
      SET
        title = ${title},
        domain_name = ${domain},
        topic_name = ${topic},
        status = ${newStatus},
        actual_focus_seconds = ${actualSeconds},
        date = ${date},
        planned_start_time = ${startTime},
        planned_end_time = ${endTime},
        planned_duration_minutes = ${durationMinutes},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING *
    `;

    const block = mapRowToBlock(updated);
    return reply.status(200).send({ block });
  });

  // DELETE /api/calendar/blocks/:id
  server.delete<{
    Params: { id: string };
  }>('/api/calendar/blocks/:id', async (request, reply) => {
    const { id } = request.params;

    const deletedRows = await sql`
      DELETE FROM study_sessions
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING id
    `;

    if (deletedRows.length === 0) {
      return reply.status(404).send({ error: 'Learning block not found' });
    }

    return reply.status(200).send({ success: true, id });
  });
};
