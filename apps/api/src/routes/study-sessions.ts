import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import {
  CreateStudySessionInputSchema,
  UpdateStudySessionInputSchema,
  CompleteStudySessionInputSchema,
  type StudySessionContract,
  type StudySessionsResponseContract
} from '@sos/contracts';
import {
  getTodayDateString,
  timeStringToMinutes,
  minutesToTimeString
} from '@sos/domain';
import { randomUUID } from 'node:crypto';

export function mapRowToStudySession(row: any): StudySessionContract {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    domainId: row.domain_id ?? null,
    domainName: row.domain_name,
    topicId: row.topic_id ?? null,
    topicName: row.topic_name ?? null,
    status: row.status,
    source: row.source,
    date: row.date,
    plannedStartTime: row.planned_start_time ?? null,
    plannedEndTime: row.planned_end_time ?? null,
    plannedDurationMinutes: Number(row.planned_duration_minutes || 0),
    actualStartTimestamp: row.actual_start_timestamp ? Number(row.actual_start_timestamp) : null,
    actualEndTimestamp: row.actual_end_timestamp ? Number(row.actual_end_timestamp) : null,
    actualFocusSeconds: Number(row.actual_focus_seconds || 0),
    actualBreakSeconds: Number(row.actual_break_seconds || 0),
    timerMode: row.timer_mode || 'countdown',
    pauseIntervals: Array.isArray(row.pause_intervals) ? row.pause_intervals : [],
    notes: row.notes ?? null,
    sortOrder: Number(row.sort_order || 0),
    seriesId: row.series_id ?? null,
    recurrenceRule: row.recurrence_rule ?? null,
    isSeriesException: Boolean(row.is_series_exception),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

function computeDurationMinutes(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;
  const startMins = timeStringToMinutes(start);
  const endMins = timeStringToMinutes(end);
  return Math.max(0, endMins - startMins);
}

function formatHHMMFromTimestamp(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export const studySessionRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // GET /api/study-sessions
  server.get<{
    Querystring: {
      start?: string;
      end?: string;
      status?: string;
      domain?: string;
      topic?: string;
      search?: string;
    };
    Reply: StudySessionsResponseContract;
  }>('/api/study-sessions', async (request, reply) => {
    const { start, end, status, domain, topic, search } = request.query;

    const today = getTodayDateString();
    // Auto-mark past planned sessions as 'missed'
    await sql`
      UPDATE study_sessions
      SET status = 'missed', updated_at = NOW()
      WHERE user_id = 'default-user' AND status = 'planned' AND date < ${today}
    `;

    const conditions = [sql`user_id = 'default-user'`];

    if (start) {
      conditions.push(sql`date >= ${start}`);
    }
    if (end) {
      conditions.push(sql`date <= ${end}`);
    }
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        conditions.push(sql`status IN ${sql(statuses)}`);
      }
    }
    if (domain) {
      conditions.push(sql`(domain_name = ${domain} OR domain_id = ${domain})`);
    }
    if (topic) {
      conditions.push(sql`(topic_name = ${topic} OR topic_id = ${topic})`);
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push(sql`(title ILIKE ${term} OR notes ILIKE ${term})`);
    }

    const whereClause = conditions.reduce((acc, curr) => sql`${acc} AND ${curr}`);

    const rows = await sql`
      SELECT * FROM study_sessions
      WHERE ${whereClause}
      ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC, sort_order ASC
    `;

    const sessions = rows.map(mapRowToStudySession);
    const totalPlannedMinutes = sessions.reduce((acc, s) => acc + s.plannedDurationMinutes, 0);
    const totalActualFocusSeconds = sessions.reduce((acc, s) => acc + s.actualFocusSeconds, 0);
    const plannedCount = sessions.filter((s) => s.status === 'planned').length;
    const completedCount = sessions.filter((s) => s.status === 'completed').length;

    return reply.status(200).send({
      sessions,
      summary: {
        totalPlannedMinutes,
        totalActualFocusSeconds,
        plannedCount,
        completedCount
      }
    });
  });

  // GET /api/study-sessions/:id
  server.get<{
    Params: { id: string };
    Reply: StudySessionContract | { error: string };
  }>('/api/study-sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const rows = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;
    if (rows.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }
    return reply.status(200).send(mapRowToStudySession(rows[0]));
  });

  // POST /api/study-sessions
  server.post<{
    Body: unknown;
    Reply: StudySessionContract | { error: string };
  }>('/api/study-sessions', async (request, reply) => {
    const parseResult = CreateStudySessionInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: `Validation error: ${parseResult.error.issues.map((i: any) => i.message).join(', ')}`
      });
    }

    const input = parseResult.data;

    // Check future manual session restriction
    if (input.source === 'historical_manual') {
      if (input.actualEndTimestamp && input.actualEndTimestamp > Date.now()) {
        return reply.status(400).send({
          error: 'Cannot log historical manual sessions in the future.'
        });
      }
    }

    // Resolve domain ID if not provided
    let resolvedDomainId = input.domainId ?? null;
    if (!resolvedDomainId && input.domainName) {
      const domainRows = await sql`
        SELECT id FROM user_domains
        WHERE user_id = 'default-user' AND LOWER(name) = LOWER(${input.domainName})
      `;
      if (domainRows.length > 0) {
        resolvedDomainId = domainRows[0].id;
      } else {
        const newDomainId = randomUUID();
        await sql`
          INSERT INTO user_domains (id, user_id, name, color_token)
          VALUES (${newDomainId}, 'default-user', ${input.domainName}, 'accent-100')
          ON CONFLICT (user_id, name) DO NOTHING
        `;
        resolvedDomainId = newDomainId;
      }
    }

    // Resolve topic ID if topic name given
    let resolvedTopicId = input.topicId ?? null;
    if (!resolvedTopicId && input.topicName && resolvedDomainId) {
      const topicRows = await sql`
        SELECT id FROM user_topics
        WHERE user_id = 'default-user' AND domain_id = ${resolvedDomainId} AND LOWER(name) = LOWER(${input.topicName})
      `;
      if (topicRows.length > 0) {
        resolvedTopicId = topicRows[0].id;
      } else {
        const newTopicId = randomUUID();
        await sql`
          INSERT INTO user_topics (id, user_id, domain_id, name)
          VALUES (${newTopicId}, 'default-user', ${resolvedDomainId}, ${input.topicName})
          ON CONFLICT (user_id, domain_id, name) DO NOTHING
        `;
        resolvedTopicId = newTopicId;
      }
    }

    const durationMinutes = input.plannedDurationMinutes ?? computeDurationMinutes(input.plannedStartTime, input.plannedEndTime);

    // Handle recurring series creation
    if (input.recurrenceRule && input.source === 'calendar') {
      const seriesId = randomUUID();
      const frequency = input.recurrenceRule.frequency;
      const daysOfWeek = input.recurrenceRule.daysOfWeek;
      const endDate = input.recurrenceRule.endDate;

      const startDateObj = new Date(`${input.date}T00:00:00Z`);
      const maxEndDateObj = new Date(startDateObj);
      maxEndDateObj.setDate(maxEndDateObj.getDate() + 90); // Cap at 90 days

      let seriesEndDateObj = maxEndDateObj;
      if (endDate) {
        const requestedEnd = new Date(`${endDate}T00:00:00Z`);
        if (requestedEnd < maxEndDateObj) {
          seriesEndDateObj = requestedEnd;
        }
      }

      const generatedDates: string[] = [];
      const current = new Date(startDateObj);

      while (current <= seriesEndDateObj && generatedDates.length < 90) {
        const iso = current.toISOString().split('T')[0];
        const dayOfWeek = current.getUTCDay();

        if (frequency === 'daily') {
          generatedDates.push(iso);
        } else if (frequency === 'weekly') {
          if (!daysOfWeek || daysOfWeek.length === 0) {
            if (dayOfWeek === startDateObj.getUTCDay()) {
              generatedDates.push(iso);
            }
          } else if (daysOfWeek.includes(dayOfWeek)) {
            generatedDates.push(iso);
          }
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }

      if (generatedDates.length === 0) {
        generatedDates.push(input.date);
      }

      let firstRow: any = null;
      for (let i = 0; i < generatedDates.length; i++) {
        const targetDate = generatedDates[i];
        const newId = randomUUID();
        const inserted = await sql`
          INSERT INTO study_sessions (
            id, user_id, title, domain_id, domain_name, topic_id, topic_name,
            status, source, date, planned_start_time, planned_end_time,
            planned_duration_minutes, actual_start_timestamp, actual_end_timestamp,
            actual_focus_seconds, actual_break_seconds, timer_mode, pause_intervals,
            notes, sort_order, series_id, recurrence_rule, is_series_exception
          ) VALUES (
            ${newId}, 'default-user', ${input.title}, ${resolvedDomainId}, ${input.domainName},
            ${resolvedTopicId}, ${input.topicName ?? null}, ${input.status}, ${input.source},
            ${targetDate}, ${input.plannedStartTime ?? null}, ${input.plannedEndTime ?? null},
            ${durationMinutes}, ${input.actualStartTimestamp ?? null}, ${input.actualEndTimestamp ?? null},
            ${input.actualFocusSeconds ?? 0}, ${input.actualBreakSeconds ?? 0}, ${input.timerMode},
            ${JSON.stringify([])}::jsonb, ${input.notes ?? null}, 0,
            ${seriesId}, ${JSON.stringify(input.recurrenceRule)}::jsonb, false
          )
          RETURNING *
        `;
        if (i === 0) {
          firstRow = inserted[0];
        }
      }

      return reply.status(201).send(mapRowToStudySession(firstRow));
    }

    // Single session insertion
    const id = randomUUID();
    const actualFocusSeconds = input.actualFocusSeconds ?? (input.source === 'historical_manual' ? durationMinutes * 60 : 0);
    const status = input.source === 'historical_manual' ? 'completed' : input.status;

    const inserted = await sql`
      INSERT INTO study_sessions (
        id, user_id, title, domain_id, domain_name, topic_id, topic_name,
        status, source, date, planned_start_time, planned_end_time,
        planned_duration_minutes, actual_start_timestamp, actual_end_timestamp,
        actual_focus_seconds, actual_break_seconds, timer_mode, pause_intervals,
        notes, sort_order, series_id, recurrence_rule, is_series_exception
      ) VALUES (
        ${id}, 'default-user', ${input.title}, ${resolvedDomainId}, ${input.domainName},
        ${resolvedTopicId}, ${input.topicName ?? null}, ${status}, ${input.source},
        ${input.date}, ${input.plannedStartTime ?? null}, ${input.plannedEndTime ?? null},
        ${durationMinutes}, ${input.actualStartTimestamp ?? null}, ${input.actualEndTimestamp ?? null},
        ${actualFocusSeconds}, ${input.actualBreakSeconds ?? 0}, ${input.timerMode},
        ${JSON.stringify([])}::jsonb, ${input.notes ?? null}, 0,
        null, null, false
      )
      RETURNING *
    `;

    return reply.status(201).send(mapRowToStudySession(inserted[0]));
  });

  // POST /api/study-sessions/:id/start
  server.post<{
    Params: { id: string };
    Reply: StudySessionContract | { error: string };
  }>('/api/study-sessions/:id/start', async (request, reply) => {
    const { id } = request.params;
    const now = Date.now();

    const updated = await sql`
      UPDATE study_sessions
      SET
        status = 'in_progress',
        actual_start_timestamp = COALESCE(actual_start_timestamp, ${now}),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING *
    `;

    if (updated.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }

    return reply.status(200).send(mapRowToStudySession(updated[0]));
  });

  // POST /api/study-sessions/:id/complete
  server.post<{
    Params: { id: string };
    Body: unknown;
    Reply: StudySessionContract | { error: string };
  }>('/api/study-sessions/:id/complete', async (request, reply) => {
    const { id } = request.params;
    const parseResult = CompleteStudySessionInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: `Validation error: ${parseResult.error.issues.map((i: any) => i.message).join(', ')}`
      });
    }

    const input = parseResult.data;
    const existing = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;
    if (existing.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }

    const currentSession = existing[0];
    const now = input.actualEndTimestamp || Date.now();
    const actualStart = currentSession.actual_start_timestamp
      ? Number(currentSession.actual_start_timestamp)
      : now - (input.actualFocusSeconds * 1000);

    let finalDate = currentSession.date;
    let finalStartTime = currentSession.planned_start_time;
    let finalEndTime = currentSession.planned_end_time;
    let finalPlannedDuration = currentSession.planned_duration_minutes;

    // For timer_adhoc sessions: compute concrete calendar times on completion
    if (currentSession.source === 'timer_adhoc') {
      finalDate = getTodayDateString();
      finalStartTime = formatHHMMFromTimestamp(actualStart);
      finalEndTime = formatHHMMFromTimestamp(now);
      finalPlannedDuration = Math.max(1, Math.round(input.actualFocusSeconds / 60));
    }

    const updated = await sql`
      UPDATE study_sessions
      SET
        status = 'completed',
        date = ${finalDate},
        planned_start_time = ${finalStartTime},
        planned_end_time = ${finalEndTime},
        planned_duration_minutes = ${finalPlannedDuration},
        actual_start_timestamp = ${actualStart},
        actual_end_timestamp = ${now},
        actual_focus_seconds = ${input.actualFocusSeconds},
        actual_break_seconds = ${input.actualBreakSeconds},
        pause_intervals = ${JSON.stringify(input.pauseIntervals || [])}::jsonb,
        notes = COALESCE(${input.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING *
    `;

    return reply.status(200).send(mapRowToStudySession(updated[0]));
  });

  // POST /api/study-sessions/:id/abort
  server.post<{
    Params: { id: string };
    Reply: { success: boolean; action: 'reverted' | 'deleted'; session?: StudySessionContract } | { error: string };
  }>('/api/study-sessions/:id/abort', async (request, reply) => {
    const { id } = request.params;
    const existing = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;
    if (existing.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }

    const session = existing[0];

    if (session.source === 'timer_adhoc') {
      // 0m abort for ad-hoc: delete session cleanly so no zero-duration record pollutes history
      await sql`DELETE FROM study_sessions WHERE id = ${id}`;
      return reply.status(200).send({ success: true, action: 'deleted' });
    }

    // Calendar session: revert to planned state
    const reverted = await sql`
      UPDATE study_sessions
      SET
        status = 'planned',
        actual_start_timestamp = null,
        actual_end_timestamp = null,
        actual_focus_seconds = 0,
        actual_break_seconds = 0,
        pause_intervals = '[]'::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return reply.status(200).send({
      success: true,
      action: 'reverted',
      session: mapRowToStudySession(reverted[0])
    });
  });

  // PATCH /api/study-sessions/reorder
  server.patch<{
    Body: { sessionIds: string[] };
  }>('/api/study-sessions/reorder', async (request, reply) => {
    const { sessionIds } = (request.body as any) || {};
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return reply.status(400).send({ error: 'sessionIds array is required' });
    }

    for (let order = 0; order < sessionIds.length; order++) {
      const id = sessionIds[order];
      await sql`
        UPDATE study_sessions
        SET sort_order = ${order}, updated_at = NOW()
        WHERE id = ${id} AND user_id = 'default-user'
      `;
    }

    return reply.status(200).send({ success: true, count: sessionIds.length });
  });

  // PATCH /api/study-sessions/:id
  server.patch<{
    Params: { id: string };
    Body: unknown;
    Reply: StudySessionContract | { error: string };
  }>('/api/study-sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const parseResult = UpdateStudySessionInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: `Validation error: ${parseResult.error.issues.map((i: any) => i.message).join(', ')}`
      });
    }

    const input = parseResult.data;
    const existing = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;
    if (existing.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }

    const current = existing[0];
    const scope = input.scope || 'single';

    let newStartTime = input.plannedStartTime !== undefined ? input.plannedStartTime : current.planned_start_time;
    let newEndTime = input.plannedEndTime !== undefined ? input.plannedEndTime : current.planned_end_time;
    let newDuration = input.plannedDurationMinutes !== undefined
      ? input.plannedDurationMinutes
      : (newStartTime && newEndTime ? computeDurationMinutes(newStartTime, newEndTime) : current.planned_duration_minutes);

    if (scope === 'following' && current.series_id) {
      // Update this and all subsequent sessions in series
      await sql`
        UPDATE study_sessions
        SET
          title = COALESCE(${input.title ?? null}, title),
          domain_name = COALESCE(${input.domainName ?? null}, domain_name),
          domain_id = COALESCE(${input.domainId ?? null}, domain_id),
          topic_name = COALESCE(${input.topicName ?? null}, topic_name),
          topic_id = COALESCE(${input.topicId ?? null}, topic_id),
          planned_start_time = ${newStartTime},
          planned_end_time = ${newEndTime},
          planned_duration_minutes = ${newDuration},
          notes = COALESCE(${input.notes ?? null}, notes),
          updated_at = NOW()
        WHERE user_id = 'default-user' AND series_id = ${current.series_id} AND date >= ${current.date}
      `;

      const reFetched = await sql`SELECT * FROM study_sessions WHERE id = ${id}`;
      return reply.status(200).send(mapRowToStudySession(reFetched[0]));
    }

    // Single session update
    const isSeriesException = current.series_id ? true : current.is_series_exception;

    const updated = await sql`
      UPDATE study_sessions
      SET
        title = COALESCE(${input.title ?? null}, title),
        domain_name = COALESCE(${input.domainName ?? null}, domain_name),
        domain_id = COALESCE(${input.domainId ?? null}, domain_id),
        topic_name = COALESCE(${input.topicName ?? null}, topic_name),
        topic_id = COALESCE(${input.topicId ?? null}, topic_id),
        status = COALESCE(${input.status ?? null}, status),
        date = COALESCE(${input.date ?? null}, date),
        planned_start_time = ${newStartTime},
        planned_end_time = ${newEndTime},
        planned_duration_minutes = ${newDuration},
        timer_mode = COALESCE(${input.timerMode ?? null}, timer_mode),
        notes = COALESCE(${input.notes ?? null}, notes),
        sort_order = COALESCE(${input.sortOrder ?? null}, sort_order),
        is_series_exception = ${isSeriesException},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = 'default-user'
      RETURNING *
    `;

    return reply.status(200).send(mapRowToStudySession(updated[0]));
  });

  // DELETE /api/study-sessions/:id
  server.delete<{
    Params: { id: string };
    Querystring: { scope?: 'single' | 'following' };
    Reply: { success: boolean; deletedCount: number } | { error: string };
  }>('/api/study-sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const { scope } = request.query;

    const existing = await sql`
      SELECT * FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
    `;
    if (existing.length === 0) {
      return reply.status(404).send({ error: `Study session ${id} not found` });
    }

    const current = existing[0];

    if (scope === 'following' && current.series_id) {
      const deleted = await sql`
        DELETE FROM study_sessions
        WHERE user_id = 'default-user' AND series_id = ${current.series_id} AND date >= ${current.date}
        RETURNING id
      `;
      return reply.status(200).send({ success: true, deletedCount: deleted.length });
    }

    const deleted = await sql`
      DELETE FROM study_sessions WHERE id = ${id} AND user_id = 'default-user'
      RETURNING id
    `;
    return reply.status(200).send({ success: true, deletedCount: deleted.length });
  });
};
