import type { FastifyPluginAsync } from 'fastify';
import { getSqlClient } from '../db.js';
import type {
  UserProfile,
  UserPost,
  UserSharedResource,
  UserCommunity
} from '@sos/domain';
import {
  getTodayDateString,
  getWeekRangeForDate
} from '@sos/domain';
import type {
  AnnualHeatmapDay,
  ProfileTelemetryResponseContract
} from '@sos/contracts';

let userPosts: UserPost[] = [];
const sharedResources: UserSharedResource[] = [];
const userCommunities: UserCommunity[] = [];

export const profileRoutes: FastifyPluginAsync = async (server) => {
  const sql = getSqlClient();

  // Helper to map DB row to UserProfile
  const mapRowToProfile = (row: any): UserProfile => {
    return {
      id: row.id,
      name: row.name,
      handle: row.username,
      isAuthenticated: true,
      email: row.email,
      institution: row.education,
      education: row.education,
      learningFocus: row.learning_focus,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      coverImage: row.cover_image,
      joinedDate: row.joined_date || 'November 2026',
      location: row.location,
      website: 'https://sos.study',
      academicTracks: [
        'Computer Systems Architecture',
        'Distributed Systems & Local-First Software',
        'Cognitive Science & Spaced Retrieval',
        'Neuroscience & Memory Consolidation'
      ],
      stats: {
        followersCount: 0,
        followingCount: 0,
        studyTimeHours: 0,
        streakDays: 0,
        contributionsCount: 0
      }
    };
  };

  // GET /api/profile
  server.get<{ Reply: UserProfile }>('/api/profile', async (_req, reply) => {
    try {
      const rows = await sql`SELECT * FROM user_profiles WHERE id = 'default-user' LIMIT 1`;
      if (rows.length > 0) {
        return reply.status(200).send(mapRowToProfile(rows[0]));
      }
    } catch (e) {
      server.log.warn(e, 'Failed to fetch user_profiles from DB, fallback');
    }

    // Default fallback
    return reply.status(200).send({
      id: 'default-user',
      name: 'Abdalla Husin',
      handle: '@abdalla7usin',
      isAuthenticated: true,
      institution: 'Mansoura University',
      education: 'Mansoura University',
      learningFocus: 'Computer Science & Cognitive Systems',
      bio: 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
      avatarUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
      joinedDate: 'November 2026',
      location: 'Mansoura, Egypt',
      website: 'https://sos.study',
      stats: {
        followersCount: 0,
        followingCount: 0,
        studyTimeHours: 0,
        streakDays: 0,
        contributionsCount: 0
      }
    });
  });

  // PUT /api/profile
  server.put<{ Body: Partial<UserProfile>; Reply: UserProfile }>('/api/profile', async (req, reply) => {
    const b = req.body;
    try {
      const updated = await sql`
        UPDATE user_profiles
        SET
          name = COALESCE(${b.name ?? null}, name),
          username = COALESCE(${b.handle ?? null}, username),
          email = COALESCE(${b.email ?? null}, email),
          learning_focus = COALESCE(${b.learningFocus ?? null}, learning_focus),
          avatar_url = COALESCE(${b.avatarUrl ?? null}, avatar_url),
          cover_image = COALESCE(${b.coverImage ?? null}, cover_image),
          bio = COALESCE(${b.bio ?? null}, bio),
          location = COALESCE(${b.location ?? null}, location),
          education = COALESCE(${b.education ?? b.institution ?? null}, education),
          joined_date = COALESCE(${b.joinedDate ?? null}, joined_date),
          updated_at = NOW()
        WHERE id = 'default-user'
        RETURNING *
      `;
      if (updated.length > 0) {
        return reply.status(200).send(mapRowToProfile(updated[0]));
      }
    } catch (e) {
      server.log.warn(e, 'Failed to update user_profiles in DB');
    }

    return reply.status(200).send({
      id: 'default-user',
      name: b.name || 'Abdalla Husin',
      handle: b.handle || '@abdalla7usin',
      isAuthenticated: true,
      education: b.education || 'Mansoura University',
      institution: b.education || 'Mansoura University',
      learningFocus: b.learningFocus || 'Computer Science & Cognitive Systems',
      bio: b.bio || 'Computer Science undergraduate exploring distributed consensus, compiler design, and how human memory consolidates complex ideas.',
      avatarUrl: b.avatarUrl,
      coverImage: b.coverImage,
      joinedDate: b.joinedDate || 'November 2026',
      location: b.location || 'Mansoura, Egypt'
    });
  });

  // GET /api/profile/telemetry - real database aggregation of study_sessions & tracking
  server.get<{ Reply: ProfileTelemetryResponseContract }>('/api/profile/telemetry', async (_req, reply) => {
    const today = getTodayDateString();
    const weekStart = 'saturday';

    // 52 weeks = 364 days.
    const anchorWeekRange = getWeekRangeForDate(today, weekStart);
    const gridEndIso = anchorWeekRange.end;

    const gridEndDate = new Date(`${gridEndIso}T00:00:00Z`);
    const gridStartDate = new Date(gridEndDate);
    gridStartDate.setUTCDate(gridStartDate.getUTCDate() - (52 * 7 - 1));
    const gridStartIso = gridStartDate.toISOString().split('T')[0];

    // Query all completed sessions in the trailing 52 weeks
    let rows: any[] = [];
    try {
      rows = await sql`
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
    } catch (e) {
      server.log.warn(e, 'Failed to query completed study_sessions for telemetry');
    }

    const dayStatsMap = new Map<string, { totalSeconds: number; count: number }>();
    for (const r of rows) {
      dayStatsMap.set(r.date, {
        totalSeconds: Number(r.total_focus_seconds || 0),
        count: Number(r.session_count || 0)
      });
    }

    const dayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
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
    let streakRows: any[] = [];
    try {
      streakRows = await sql`
        SELECT DISTINCT date
        FROM study_sessions
        WHERE user_id = 'default-user'
          AND status = 'completed'
          AND actual_focus_seconds >= 600
        ORDER BY date DESC
      `;
    } catch (e) {
      server.log.warn(e, 'Failed to query streak rows');
    }

    const qualifiedDatesSet = new Set<string>(streakRows.map((r) => r.date));

    let currentStreak = 0;
    const checkDate = new Date(`${today}T00:00:00Z`);

    if (!qualifiedDatesSet.has(today)) {
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
    const totalStudyTimeFormatted = `${totalHours} ${totalHours === 1 ? 'Hour' : 'Hours'}`;
    const currentStreakFormatted = `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`;

    // Real Daily Average calculation: totalStudyMinutes / 60 / activeDaysCount
    const activeDaysCount = Array.from(dayStatsMap.values()).filter((s) => s.totalSeconds > 0).length;
    const dailyAverageHours =
      activeDaysCount > 0 ? Math.round(((totalFocusSecondsYear / 3600) / activeDaysCount) * 10) / 10 : 0.0;
    const dailyAverageFormatted = `${dailyAverageHours} ${dailyAverageHours === 1 ? 'Hour' : 'Hours'}`;

    // Date range label: e.g. "Dec 2025 - Nov 2026"
    const startMonth = gridStartDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endMonth = gridEndDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dateRangeLabel = `${startMonth} - ${endMonth}`;

    return reply.status(200).send({
      totalStudyTimeHours: totalHours,
      totalStudyTimeFormatted,
      currentStreakDays: currentStreak,
      currentStreakFormatted,
      dailyAverageHours,
      dailyAverageFormatted,
      startDate: gridStartIso,
      endDate: gridEndIso,
      dateRangeLabel,
      weeks
    });
  });

  // GET /api/profile/activity - calculates activity metrics & daily contributions array
  server.get('/api/profile/activity', async (_req, reply) => {
    const today = getTodayDateString();
    const anchorWeekRange = getWeekRangeForDate(today, 'saturday');
    const gridEndIso = anchorWeekRange.end;
    const gridEndDate = new Date(`${gridEndIso}T00:00:00Z`);
    const gridStartDate = new Date(gridEndDate);
    gridStartDate.setUTCDate(gridStartDate.getUTCDate() - (52 * 7 - 1));
    const gridStartIso = gridStartDate.toISOString().split('T')[0];

    let rows: any[] = [];
    try {
      rows = await sql`
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
    } catch (e) {
      server.log.warn(e, 'Failed to query completed study_sessions for activity');
    }

    const dayStatsMap = new Map<string, { totalSeconds: number; count: number }>();
    for (const r of rows) {
      dayStatsMap.set(r.date, {
        totalSeconds: Number(r.total_focus_seconds || 0),
        count: Number(r.session_count || 0)
      });
    }

    const dayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dailyContributions: any[] = [];
    let currentDayIter = new Date(gridStartDate);
    let totalFocusSecondsYear = 0;
    let totalContributions = 0;

    for (let w = 0; w < 52; w++) {
      for (let d = 0; d < 7; d++) {
        const iso = currentDayIter.toISOString().split('T')[0];
        const dayLabel = dayLabels[d];
        const stats = dayStatsMap.get(iso);
        const seconds = stats ? stats.totalSeconds : 0;
        const count = stats ? stats.count : 0;
        totalFocusSecondsYear += seconds;
        totalContributions += count;

        const hours = Math.round((seconds / 3600) * 10) / 10;
        let level = 0;
        if (hours > 0 && hours < 1) level = 1;
        else if (hours >= 1 && hours < 2) level = 2;
        else if (hours >= 2 && hours < 4) level = 3;
        else if (hours >= 4) level = 4;

        dailyContributions.push({
          date: iso,
          dayLabel,
          hours,
          level,
          count
        });

        currentDayIter.setUTCDate(currentDayIter.getUTCDate() + 1);
      }
    }

    let streakRows: any[] = [];
    try {
      streakRows = await sql`
        SELECT DISTINCT date
        FROM study_sessions
        WHERE user_id = 'default-user'
          AND status = 'completed'
          AND actual_focus_seconds >= 600
        ORDER BY date DESC
      `;
    } catch (e) {
      server.log.warn(e, 'Failed to query streak rows for activity');
    }

    const qualifiedDatesSet = new Set<string>(streakRows.map((r) => r.date));
    let currentStreak = 0;
    const checkDate = new Date(`${today}T00:00:00Z`);
    if (!qualifiedDatesSet.has(today)) {
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

    return reply.status(200).send({
      totalContributions,
      currentStreakDays: currentStreak,
      totalStudyTimeHours: totalHours,
      dailyContributions
    });
  });

  // GET /api/profile/posts
  server.get<{ Reply: UserPost[] }>('/api/profile/posts', async (_req, reply) => {
    return reply.status(200).send(userPosts);
  });

  // POST /api/profile/posts
  server.post<{ Body: { content: string; mediaUrl?: string; mediaType?: 'image' | 'whiteboard' }; Reply: UserPost }>(
    '/api/profile/posts',
    async (req, reply) => {
      const newPost: UserPost = {
        id: `post-${Date.now()}`,
        authorId: 'default-user',
        authorName: 'Abdalla Husin',
        authorHandle: '@abdalla7usin',
        authorAvatarUrl: 'https://lh3.googleusercontent.com/aida/ALJJyrBE6EhsHOqBp174KlEE0XrgpcMjQmblnn2X7vXwDJVOKYPKb7yDZ06Vw_NqRcsrxOTsrvWRxDQX_0hgDLbZ2XZM7agGIy8rbv8bYGWpaF2d30oXkxqAisUNXabuoiebdVqFtSLIzj8vaZjVK-aSHuO3rGxN6TKHDCpJKjXzUfwMEsiIP42arHCi1DVwgFwpbkHrHihNRxcMxFhP6g71n-Ej2xAqvNVjJ8X9dDARkQt3DmGe0NVBhLB-3fYriiCAu3BiIg',
        content: req.body.content,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        isLiked: false,
        mediaUrl: req.body.mediaUrl,
        mediaType: req.body.mediaType
      };
      userPosts = [newPost, ...userPosts];
      return reply.status(201).send(newPost);
    }
  );

  // POST /api/profile/posts/:id/like
  server.post<{ Params: { id: string }; Reply: UserPost | { error: string } }>(
    '/api/profile/posts/:id/like',
    async (req, reply) => {
      const post = userPosts.find((p) => p.id === req.params.id);
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      post.isLiked = !post.isLiked;
      post.likesCount = post.isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
      return reply.status(200).send(post);
    }
  );

  // GET /api/profile/resources
  server.get<{ Reply: UserSharedResource[] }>('/api/profile/resources', async (_req, reply) => {
    return reply.status(200).send(sharedResources);
  });

  // GET /api/profile/communities
  server.get<{ Reply: UserCommunity[] }>('/api/profile/communities', async (_req, reply) => {
    return reply.status(200).send(userCommunities);
  });
};
