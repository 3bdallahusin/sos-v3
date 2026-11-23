import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import {
  type TrackingAnalyticsResponseContract,
  type AnnualHeatmapResponseContract,
  type AnnualHeatmapDay
} from '@sos/contracts';
import {
  getTodayDateString,
  getWeekRangeForDate,
  getMonthRangeForDate
} from '@sos/domain';

const ACCENT_COLORS = [
  '#60A5FA', // Primary Blue
  '#94A3B8', // Slate Silver
  '#A78BFA', // Muted Violet
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F472B6'  // Rose
];

export const trackingRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // GET /api/tracking/analytics
  server.get<{
    Querystring: {
      period?: 'day' | 'week' | 'month';
      date?: string;
    };
    Reply: TrackingAnalyticsResponseContract;
  }>('/api/tracking/analytics', async (request, reply) => {
    const period = request.query.period || 'week';
    const referenceDate = request.query.date || getTodayDateString();

    let startDate = referenceDate;
    let endDate = referenceDate;

    if (period === 'day') {
      startDate = referenceDate;
      endDate = referenceDate;
    } else if (period === 'week') {
      const range = getWeekRangeForDate(referenceDate, 'saturday');
      startDate = range.start;
      endDate = range.end;
    } else if (period === 'month') {
      const range = getMonthRangeForDate(referenceDate);
      startDate = range.start;
      endDate = range.end;
    }

    // Query all sessions in range
    const sessions = await sql`
      SELECT * FROM study_sessions
      WHERE user_id = 'default-user'
        AND date >= ${startDate}
        AND date <= ${endDate}
      ORDER BY date ASC, COALESCE(planned_start_time, '23:59') ASC
    `;

    // Calculate points
    const pointsMap = new Map<string, { label: string; dateKey: string; actualHours: number; plannedHours: number }>();

    if (period === 'day') {
      // 6 4-hour slots across the day
      const slots = [
        { label: '00:00', startHour: 0, endHour: 4 },
        { label: '04:00', startHour: 4, endHour: 8 },
        { label: '08:00', startHour: 8, endHour: 12 },
        { label: '12:00', startHour: 12, endHour: 16 },
        { label: '16:00', startHour: 16, endHour: 20 },
        { label: '20:00', startHour: 20, endHour: 24 }
      ];

      for (const slot of slots) {
        pointsMap.set(slot.label, {
          label: slot.label,
          dateKey: referenceDate,
          actualHours: 0,
          plannedHours: 0
        });
      }

      for (const s of sessions) {
        const timeStr = s.planned_start_time || '12:00';
        const hour = parseInt(timeStr.split(':')[0], 10) || 0;
        const matchingSlot = slots.find((sl) => hour >= sl.startHour && hour < sl.endHour) || slots[3];
        const pt = pointsMap.get(matchingSlot.label)!;
        if (s.status === 'completed') {
          pt.actualHours += Number(s.actual_focus_seconds || 0) / 3600;
        }
        pt.plannedHours += Number(s.planned_duration_minutes || 0) / 60;
      }
    } else if (period === 'week') {
      const dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const cur = new Date(`${startDate}T00:00:00Z`);

      for (let i = 0; i < 7; i++) {
        const iso = cur.toISOString().split('T')[0];
        const label = dayNames[i];
        pointsMap.set(iso, {
          label,
          dateKey: iso,
          actualHours: 0,
          plannedHours: 0
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      for (const s of sessions) {
        const pt = pointsMap.get(s.date);
        if (pt) {
          if (s.status === 'completed') {
            pt.actualHours += Number(s.actual_focus_seconds || 0) / 3600;
          }
          pt.plannedHours += Number(s.planned_duration_minutes || 0) / 60;
        }
      }
    } else if (period === 'month') {
      const cur = new Date(`${startDate}T00:00:00Z`);
      const endObj = new Date(`${endDate}T00:00:00Z`);

      while (cur <= endObj) {
        const iso = cur.toISOString().split('T')[0];
        const dayNum = String(cur.getUTCDate());
        pointsMap.set(iso, {
          label: dayNum,
          dateKey: iso,
          actualHours: 0,
          plannedHours: 0
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      for (const s of sessions) {
        const pt = pointsMap.get(s.date);
        if (pt) {
          if (s.status === 'completed') {
            pt.actualHours += Number(s.actual_focus_seconds || 0) / 3600;
          }
          pt.plannedHours += Number(s.planned_duration_minutes || 0) / 60;
        }
      }
    }

    const learningHoursPoints = Array.from(pointsMap.values()).map((p) => ({
      label: p.label,
      dateKey: p.dateKey,
      actualHours: Math.round(p.actualHours * 10) / 10,
      plannedHours: Math.round(p.plannedHours * 10) / 10
    }));

    // Domain distribution
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const domainHoursMap = new Map<string, { domainId?: string; hours: number }>();

    for (const s of completedSessions) {
      const dName = s.domain_name || 'General';
      const existing = domainHoursMap.get(dName) || { domainId: s.domain_id ?? undefined, hours: 0 };
      existing.hours += Number(s.actual_focus_seconds || 0) / 3600;
      domainHoursMap.set(dName, existing);
    }

    const totalActualFocusSeconds = completedSessions.reduce(
      (acc, s) => acc + Number(s.actual_focus_seconds || 0),
      0
    );
    const totalFocusHours = Math.round((totalActualFocusSeconds / 3600) * 10) / 10;

    const totalPlannedMinutes = sessions.reduce(
      (acc, s) => acc + Number(s.planned_duration_minutes || 0),
      0
    );
    const totalPlannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;

    const domainDistribution = Array.from(domainHoursMap.entries())
      .map(([domainName, val], idx) => {
        const hours = Math.round(val.hours * 10) / 10;
        const percentage = totalFocusHours > 0 ? Math.round((hours / totalFocusHours) * 100) : 0;
        const colorHex = ACCENT_COLORS[idx % ACCENT_COLORS.length];
        return {
          domainName,
          domainId: val.domainId,
          fieldName: domainName,
          fieldId: val.domainId,
          hours,
          percentage,
          colorHex
        };
      })
      .sort((a, b) => b.hours - a.hours);

    const adherenceRate = totalPlannedHours > 0
      ? Math.min(100, Math.round((totalFocusHours / totalPlannedHours) * 100))
      : 100;

    const daysCount = pointsMap.size || 1;
    const dailyAverageHours = Math.round((totalFocusHours / daysCount) * 10) / 10;

    return reply.status(200).send({
      period,
      referenceDate,
      totalFocusHours,
      dailyAverageHours,
      adherenceRate,
      learningHoursPoints,
      studyHoursPoints: learningHoursPoints,
      domainDistribution,
      fieldDistribution: domainDistribution,
      activeDomainCount: domainDistribution.length,
      activeFieldCount: domainDistribution.length
    });
  });

  // GET /api/tracking/heatmap
  server.get<{
    Querystring: {
      endDate?: string;
      weekStart?: 'saturday' | 'monday';
    };
    Reply: AnnualHeatmapResponseContract;
  }>('/api/tracking/heatmap', async (request, reply) => {
    const today = getTodayDateString();
    const anchorDate = request.query.endDate || today;
    const weekStart = request.query.weekStart || 'saturday';

    // 52 weeks = 364 days.
    // Determine the end of the week containing anchorDate
    const anchorWeekRange = getWeekRangeForDate(anchorDate, weekStart);
    const gridEndIso = anchorWeekRange.end;

    // Calculate grid start date: 52 weeks prior
    const gridEndDate = new Date(`${gridEndIso}T00:00:00Z`);
    const gridStartDate = new Date(gridEndDate);
    gridStartDate.setUTCDate(gridStartDate.getUTCDate() - (52 * 7 - 1)); // 364 days total
    const gridStartIso = gridStartDate.toISOString().split('T')[0];

    // Query all completed sessions in range
    const rows = await sql`
      SELECT
        date,
        SUM(actual_focus_seconds) as total_focus_seconds,
        COUNT(*) as session_count
      FROM study_sessions
      WHERE user_id = 'default-user'
        AND status = 'completed'
        AND date >= ${gridStartIso}
        AND date <= ${gridEndIso}
      GROUP BY date
    `;

    const dayStatsMap = new Map<string, { totalSeconds: number; count: number }>();
    for (const r of rows) {
      dayStatsMap.set(r.date, {
        totalSeconds: Number(r.total_focus_seconds || 0),
        count: Number(r.session_count || 0)
      });
    }

    const dayLabelsMap: Record<'saturday' | 'monday', string[]> = {
      saturday: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      monday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };
    const dayLabels = dayLabelsMap[weekStart] || dayLabelsMap.saturday;

    const weeks: AnnualHeatmapDay[][] = [];
    let currentDayIter = new Date(gridStartDate);
    let totalFocusSecondsYear = 0;

    for (let w = 0; w < 52; w++) {
      const weekDays: AnnualHeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = currentDayIter.toISOString().split('T')[0];
        const dayLabel = dayLabels[d];
        const isFuture = iso > today;
        const stats = dayStatsMap.get(iso);
        const seconds = stats ? stats.totalSeconds : 0;
        totalFocusSecondsYear += seconds;

        const hours = Math.round((seconds / 3600) * 10) / 10;
        let level = 0;
        if (hours > 0 && hours < 1) level = 1;
        else if (hours >= 1 && hours < 2) level = 2;
        else if (hours >= 2 && hours < 4) level = 3;
        else if (hours >= 4) level = 4;

        weekDays.push({
          date: iso,
          dayLabel,
          hours,
          level,
          isFuture
        });

        currentDayIter.setUTCDate(currentDayIter.getUTCDate() + 1);
      }
      weeks.push(weekDays);
    }

    // Real Streak calculation:
    // Consecutive days counting back from today (or yesterday if today has none yet)
    // with at least one completed session where actual_focus_seconds >= 600 (10 min).
    const streakRows = await sql`
      SELECT DISTINCT date
      FROM study_sessions
      WHERE user_id = 'default-user'
        AND status = 'completed'
        AND actual_focus_seconds >= 600
      ORDER BY date DESC
    `;

    const qualifiedDatesSet = new Set<string>(streakRows.map((r) => r.date));

    let currentStreak = 0;
    const checkDate = new Date(`${today}T00:00:00Z`);

    // If today hasn't met the threshold yet, streak may be maintained from yesterday
    const todayIso = today;
    if (!qualifiedDatesSet.has(todayIso)) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    while (true) {
      const iso = checkDate.toISOString().split('T')[0];
      if (qualifiedDatesSet.has(iso)) {
        currentStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    const totalHours = Math.round((totalFocusSecondsYear / 3600) * 10) / 10;
    const activeDaysCount = dayStatsMap.size;
    const dailyAverageHours = activeDaysCount > 0
      ? Math.round((totalHours / activeDaysCount) * 10) / 10
      : 0;
    const startMonth = gridStartDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endMonth = gridEndDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dateRangeLabel = `${startMonth} - ${endMonth}`;

    return reply.status(200).send({
      weeks,
      totalHours,
      currentStreak,
      dailyAverageHours,
      startDate: gridStartIso,
      endDate: gridEndIso,
      dateRangeLabel
    } as any);
  });
};
