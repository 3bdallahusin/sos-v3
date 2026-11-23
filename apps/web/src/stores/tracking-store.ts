import { create } from 'zustand';
import {
  generateUuidV7,
  type TrackingSession,
  type TrackingSessionMode,
  type TrackingSessionStatus,
  type PauseInterval,
  type TrackingInterval,
  type WeeklyTrackingStats,
  type SessionHistoryFilter,
  type AnalyticsPeriod,
  type CrossFilterState,
  type TrackingAnalyticsReport,
  getTodayDateString,
  getWeekRangeForDate,
  getMonthRangeForDate
} from '@sos/domain';
import type {
  AnnualHeatmapResponseContract,
  StudySessionContract
} from '@sos/contracts';
import {
  saveTrackingSession,
  deleteTrackingSession,
  updateTrackingSession
} from '@sos/persistence';

const STORAGE_KEY = 'sos:active_tracking_session';

export interface StartSessionParams {
  id?: string;
  title?: string;
  mode?: TrackingSessionMode;
  targetMinutes?: number;
  breakMinutes?: number;
  domainId?: string | null;
  domainName?: string;
  topicId?: string | null;
  topicName?: string;
  fieldId?: string | null;
  fieldName?: string;
  subjectId?: string | null;
  subjectName?: string;
  folderId?: string | null;
  fileId?: string | null;
  calendarEventId?: string | null;
  resourceMeta?: string;
  notes?: string;
}

export interface CreateManualSessionParams {
  title: string;
  domainName?: string;
  domainId?: string | null;
  topicName?: string;
  fieldName?: string;
  fieldId?: string | null;
  subjectName?: string;
  dateStr: string; // YYYY-MM-DD
  startTimeStr: string; // HH:mm
  endTimeStr: string; // HH:mm
  notes?: string;
}

interface StoredActiveSession {
  id?: string;
  activeSessionId?: string | null;
  status: TrackingSessionStatus;
  phase: 'focus' | 'break';
  mode: TrackingSessionMode;
  sessionTitle: string;
  domainId?: string | null;
  domainName?: string;
  topicId?: string | null;
  topicName?: string;
  fieldId?: string | null;
  fieldName?: string;
  subjectId?: string | null;
  subjectName?: string;
  folderId: string | null;
  fileId: string | null;
  calendarEventId: string | null;
  resourceMeta?: string;
  notes?: string;
  startTime: number;
  targetDurationSeconds: number;
  breakDurationSeconds: number;
  pauseIntervals: PauseInterval[];
  focusIntervals?: TrackingInterval[];
  breakIntervals?: TrackingInterval[];
  currentPauseStart: number | null;
  breakStartTime?: number | null;
}

interface TrackingStoreState {
  activeSessionId: string | null;
  status: TrackingSessionStatus;
  phase: 'focus' | 'break';
  mode: TrackingSessionMode;
  sessionTitle: string;
  domainId: string | null;
  domainName: string;
  topicId: string | null;
  topicName: string;
  fieldId: string | null;
  fieldName: string;
  subjectId: string | null;
  subjectName: string;
  folderId: string | null;
  fileId: string | null;
  calendarEventId: string | null;
  resourceMeta?: string;
  notes?: string;
  startTime: number | null;
  targetDurationSeconds: number;
  breakDurationSeconds: number;
  pauseIntervals: PauseInterval[];
  focusIntervals: TrackingInterval[];
  breakIntervals: TrackingInterval[];
  currentPauseStart: number | null;
  breakStartTime: number | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  breakRemainingSeconds: number;

  // Persistent lists & analytics
  todaySessions: TrackingSession[];
  weeklyStats: WeeklyTrackingStats;
  historySessions: TrackingSession[];
  historyFilter: SessionHistoryFilter;
  analyticsPeriod: AnalyticsPeriod;
  analyticsRefDate: Date;
  crossFilter: CrossFilterState | null;
  analyticsReport: TrackingAnalyticsReport | null;
  heatmap: AnnualHeatmapResponseContract | null;
  isLoading: boolean;

  // View & Modal Navigation
  activeView: 'dashboard' | 'history';
  setupModalOpen: boolean;
  linkPlanModalOpen: boolean;
  endSummaryModalOpen: boolean;
  summarySession: TrackingSession | null;
  detailsModalSession: TrackingSession | null;
  editModalSession: TrackingSession | null;
  manualModalOpen: boolean;
  deleteModalSessionId: string | null;

  // Actions
  loadTrackingData: () => Promise<void>;
  loadHistoryData: () => Promise<void>;
  loadAnalyticsData: () => Promise<void>;
  startSession: (params?: StartSessionParams) => Promise<void>;
  startSessionFromCalendarBlock: (block: any) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  takeBreak: (minutes?: number) => void;
  pauseBreak: () => void;
  resumeBreak: () => void;
  resumeFocus: () => void;
  continueFocus: () => void;
  finishSession: () => Promise<TrackingSession | null>;
  saveFinishedSession: (summaryNotes?: string) => Promise<TrackingSession | null>;
  discardSession: () => Promise<void>;
  abortSession: () => Promise<void>;
  resetSession: () => void;
  createManualSession: (params: CreateManualSessionParams) => Promise<void>;

  setSessionTitle: (title: string) => void;
  setDomainAndTopic: (domainId: string | null, domainName: string, topicName?: string) => Promise<void> | void;
  setFieldAndSubject: (fieldId: string | null, fieldName: string, subjectName?: string) => Promise<void> | void;
  setLinkedResource: (folderId: string | null, fileId: string | null, resourceMeta?: string) => void;
  linkCalendarEvent: (calendarEventId: string | null, title?: string, targetMinutes?: number) => void;
  setMode: (mode: TrackingSessionMode) => void;
  setTargetMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  syncWithPomodoroInterval: (intervalOrFocus: string | number, optionalBreak?: number) => void;
  deleteSession: (id: string) => Promise<void>;
  updateSession: (id: string, updates: Partial<TrackingSession>) => Promise<void>;
  reorderTodaySessions: (orderedIds: string[]) => Promise<void>;

  // View & Modal setters
  setActiveView: (view: 'dashboard' | 'history') => void;
  setSetupModalOpen: (open: boolean) => void;
  setLinkPlanModalOpen: (open: boolean) => void;
  setEndSummaryModalOpen: (open: boolean) => void;
  setDetailsModalSession: (session: TrackingSession | null) => void;
  setEditModalSession: (session: TrackingSession | null) => void;
  setManualModalOpen: (open: boolean) => void;
  setDeleteModalSessionId: (id: string | null) => void;
  setHistoryFilter: (updates: Partial<SessionHistoryFilter>) => void;
  setAnalyticsPeriod: (period: AnalyticsPeriod) => void;
  setAnalyticsRefDate: (date: Date) => void;
  setCrossFilter: (filter: CrossFilterState | null) => void;

  tick: () => void;
}

function calculateElapsedAndRemaining(
  startTime: number | null,
  pauseIntervals: PauseInterval[],
  currentPauseStart: number | null,
  targetDurationSeconds: number,
  mode: TrackingSessionMode
): { elapsedSeconds: number; remainingSeconds: number } {
  if (!startTime) {
    return { elapsedSeconds: 0, remainingSeconds: targetDurationSeconds };
  }

  const effectiveNow = currentPauseStart ?? Date.now();
  let pausedMs = 0;
  for (const interval of pauseIntervals) {
    const end = interval.resumedAt ?? effectiveNow;
    pausedMs += Math.max(0, end - interval.pausedAt);
  }

  const rawElapsedMs = Math.max(0, effectiveNow - startTime - pausedMs);
  const elapsedSeconds = Math.floor(rawElapsedMs / 1000);

  if (mode === 'countdown') {
    const remainingSeconds = Math.max(0, targetDurationSeconds - elapsedSeconds);
    return { elapsedSeconds, remainingSeconds };
  }

  return { elapsedSeconds, remainingSeconds: 0 };
}

function loadStoredSession(): StoredActiveSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveSession;
    if (
      parsed &&
      (parsed.status === 'running' ||
        parsed.status === 'paused' ||
        parsed.status === 'break_running' ||
        parsed.status === 'break_paused' ||
        parsed.status === 'completed') &&
      parsed.startTime
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

function persistActiveSession(state: {
  activeSessionId?: string | null;
  status: TrackingSessionStatus;
  phase: 'focus' | 'break';
  mode: TrackingSessionMode;
  sessionTitle: string;
  domainId?: string | null;
  domainName?: string;
  topicId?: string | null;
  topicName?: string;
  fieldId?: string | null;
  fieldName?: string;
  subjectId?: string | null;
  subjectName?: string;
  folderId: string | null;
  fileId: string | null;
  calendarEventId: string | null;
  resourceMeta?: string;
  notes?: string;
  startTime: number | null;
  targetDurationSeconds: number;
  breakDurationSeconds: number;
  pauseIntervals: PauseInterval[];
  focusIntervals?: TrackingInterval[];
  breakIntervals?: TrackingInterval[];
  currentPauseStart: number | null;
  breakStartTime?: number | null;
}) {
  if (typeof window === 'undefined') return;
  try {
    if (state.status !== 'idle') {
      const data: StoredActiveSession = {
        activeSessionId: state.activeSessionId,
        status: state.status,
        phase: state.phase,
        mode: state.mode,
        sessionTitle: state.sessionTitle,
        domainId: state.domainId ?? state.fieldId,
        domainName: state.domainName ?? state.fieldName,
        topicId: state.topicId ?? state.subjectId,
        topicName: state.topicName ?? state.subjectName,
        fieldId: state.domainId ?? state.fieldId,
        fieldName: state.domainName ?? state.fieldName,
        subjectId: state.topicId ?? state.subjectId,
        subjectName: state.topicName ?? state.subjectName,
        folderId: state.folderId,
        fileId: state.fileId,
        calendarEventId: state.calendarEventId,
        resourceMeta: state.resourceMeta,
        notes: state.notes,
        startTime: state.startTime!,
        targetDurationSeconds: state.targetDurationSeconds,
        breakDurationSeconds: state.breakDurationSeconds,
        pauseIntervals: state.pauseIntervals,
        focusIntervals: state.focusIntervals,
        breakIntervals: state.breakIntervals,
        currentPauseStart: state.currentPauseStart,
        breakStartTime: state.breakStartTime
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

const initialStored = loadStoredSession();
const initialTargetDuration = initialStored?.targetDurationSeconds ?? 45 * 60;
const initialBreakDuration = initialStored?.breakDurationSeconds ?? 10 * 60;
const initialTimes = initialStored
  ? calculateElapsedAndRemaining(
      initialStored.startTime,
      initialStored.pauseIntervals,
      initialStored.currentPauseStart,
      initialTargetDuration,
      initialStored.mode
    )
  : { elapsedSeconds: 0, remainingSeconds: initialTargetDuration };

export const useTrackingStore = create<TrackingStoreState>((set, get) => {
  return {
    activeSessionId: initialStored?.activeSessionId ?? null,
    status: initialStored ? initialStored.status : 'idle',
    phase: initialStored?.phase ?? 'focus',
    mode: initialStored ? initialStored.mode : 'countdown',
    sessionTitle: initialStored ? initialStored.sessionTitle : 'Deep Work: Distributed Consensus',
    domainId: initialStored?.domainId ?? initialStored?.fieldId ?? null,
    domainName: initialStored?.domainName ?? initialStored?.fieldName ?? 'Computer Science',
    topicId: initialStored?.topicId ?? initialStored?.subjectId ?? null,
    topicName: initialStored?.topicName ?? initialStored?.subjectName ?? 'Distributed Systems',
    fieldId: initialStored?.domainId ?? initialStored?.fieldId ?? null,
    fieldName: initialStored?.domainName ?? initialStored?.fieldName ?? 'Computer Science',
    subjectId: initialStored?.topicId ?? initialStored?.subjectId ?? null,
    subjectName: initialStored?.topicName ?? initialStored?.subjectName ?? 'Distributed Systems',
    folderId: initialStored ? initialStored.folderId : null,
    fileId: initialStored ? initialStored.fileId : null,
    calendarEventId: initialStored ? initialStored.calendarEventId : null,
    resourceMeta: initialStored?.resourceMeta,
    notes: initialStored?.notes ?? '',
    startTime: initialStored ? initialStored.startTime : null,
    targetDurationSeconds: initialTargetDuration,
    breakDurationSeconds: initialBreakDuration,
    pauseIntervals: initialStored ? initialStored.pauseIntervals : [],
    focusIntervals: initialStored?.focusIntervals ?? [],
    breakIntervals: initialStored?.breakIntervals ?? [],
    currentPauseStart: initialStored ? initialStored.currentPauseStart : null,
    breakStartTime: initialStored?.breakStartTime ?? null,
    elapsedSeconds: initialTimes.elapsedSeconds,
    remainingSeconds: initialTimes.remainingSeconds,
    breakRemainingSeconds: initialBreakDuration,

    todaySessions: [],
    weeklyStats: {
      dailyAverageHours: 0,
      totalHours: 0,
      days: [],
      subjects: []
    },
    historySessions: [],
    historyFilter: {
      search: '',
      fieldId: 'all',
      subject: 'all',
      dateRange: 'all'
    },
    analyticsPeriod: 'week',
    analyticsRefDate: new Date(),
    crossFilter: null,
    analyticsReport: null,
    heatmap: null,
    isLoading: true,

    activeView: 'dashboard',
    setupModalOpen: false,
    linkPlanModalOpen: false,
    endSummaryModalOpen: false,
    summarySession: null,
    detailsModalSession: null,
    editModalSession: null,
    manualModalOpen: false,
    deleteModalSessionId: null,

    loadTrackingData: async () => {
      try {
        set({ isLoading: true });
        const today = getTodayDateString();

        // 1. Fetch today's study sessions from API
        const sessionsRes = await fetch(`/api/study-sessions?start=${today}&end=${today}`);
        let todaySessions: TrackingSession[] = [];
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          todaySessions = sessionsData.sessions || [];
        }

        // 2. Fetch tracking analytics report from API
        const { analyticsPeriod, analyticsRefDate } = get();
        const dateStr = analyticsRefDate.toISOString().split('T')[0];
        const analyticsRes = await fetch(
          `/api/tracking/analytics?period=${analyticsPeriod}&date=${dateStr}`
        );
        let analyticsReport: TrackingAnalyticsReport | null = null;
        if (analyticsRes.ok) {
          analyticsReport = await analyticsRes.json();
        }

        // 3. Fetch heatmap data from API
        const heatmapRes = await fetch('/api/tracking/heatmap');
        let heatmap: AnnualHeatmapResponseContract | null = null;
        if (heatmapRes.ok) {
          heatmap = await heatmapRes.json();
        }

        set({
          todaySessions,
          analyticsReport,
          heatmap,
          isLoading: false
        });

        await get().loadHistoryData();
      } catch (err) {
        console.warn('Failed to load tracking data from API:', err);
        set({ isLoading: false });
      }
    },

    loadHistoryData: async () => {
      try {
        const filter = get().historyFilter;
        const params = new URLSearchParams();
        if (filter.search) params.append('search', filter.search);
        if (filter.domainId && filter.domainId !== 'all') params.append('domain', filter.domainId);
        if (filter.topic && filter.topic !== 'all') params.append('topic', filter.topic);

        if (filter.dateRange === 'this_week') {
          const range = getWeekRangeForDate(getTodayDateString(), 'saturday');
          params.append('start', range.start);
          params.append('end', range.end);
        } else if (filter.dateRange === 'this_month') {
          const range = getMonthRangeForDate(getTodayDateString());
          params.append('start', range.start);
          params.append('end', range.end);
        }

        params.append('status', 'completed');

        const res = await fetch(`/api/study-sessions?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          set({ historySessions: data.sessions || [] });
        }
      } catch (err) {
        console.warn('Failed to load history sessions from API:', err);
      }
    },

    loadAnalyticsData: async () => {
      try {
        const { analyticsPeriod, analyticsRefDate } = get();
        const dateStr = analyticsRefDate.toISOString().split('T')[0];
        const res = await fetch(
          `/api/tracking/analytics?period=${analyticsPeriod}&date=${dateStr}`
        );
        if (res.ok) {
          const analyticsReport = await res.json();
          set({ analyticsReport });
        }
      } catch (err) {
        console.warn('Failed to load analytics data from API:', err);
      }
    },

    startSession: async (params?: StartSessionParams) => {
      const current = get();
      const mode = params?.mode ?? current.mode;
      const targetDurationSeconds = params?.targetMinutes
        ? params.targetMinutes * 60
        : current.targetDurationSeconds;
      const breakDurationSeconds = params?.breakMinutes
        ? params.breakMinutes * 60
        : current.breakDurationSeconds;

      const title = params?.title ?? current.sessionTitle ?? 'Deep Work: Distributed Consensus';
      const domainName =
        params?.domainName ?? params?.fieldName ?? current.domainName ?? current.fieldName;
      const domainId =
        params?.domainId !== undefined
          ? params.domainId
          : params?.fieldId !== undefined
          ? params.fieldId
          : current.domainId;
      const topicName =
        params?.topicName ?? params?.subjectName ?? current.topicName ?? current.subjectName;
      const topicId =
        params?.topicId !== undefined
          ? params.topicId
          : params?.subjectId !== undefined
          ? params.subjectId
          : current.topicId;

      let sessionId = params?.id || current.activeSessionId;

      if (sessionId) {
        try {
          const startRes = await fetch(`/api/study-sessions/${sessionId}/start`, { method: 'POST' });
          if (startRes.ok) {
            const started = await startRes.json();
            sessionId = started.id;
          }
        } catch (err) {
          console.warn('Failed to start session on backend:', err);
        }
      } else {
        // Create an ad-hoc session on backend
        try {
          const createRes = await fetch('/api/study-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              domainName: domainName || 'General',
              domainId: domainId || null,
              topicName: topicName || null,
              topicId: topicId || null,
              status: 'in_progress',
              source: 'timer_adhoc',
              date: getTodayDateString(),
              plannedDurationMinutes: Math.round(targetDurationSeconds / 60) || 45,
              timerMode: mode,
              actualStartTimestamp: Date.now()
            })
          });
          if (createRes.ok) {
            const created = await createRes.json();
            sessionId = created.id;
          }
        } catch (err) {
          console.warn('Failed to create adhoc session on API:', err);
        }
      }

      const startTime = Date.now();
      const pauseIntervals: PauseInterval[] = [];
      const focusIntervals: TrackingInterval[] = [{ startedAt: startTime, endedAt: null }];
      const breakIntervals: TrackingInterval[] = [];

      const times = calculateElapsedAndRemaining(
        startTime,
        pauseIntervals,
        null,
        targetDurationSeconds,
        mode
      );

      const newState = {
        activeSessionId: sessionId,
        status: 'running' as const,
        phase: 'focus' as const,
        mode,
        sessionTitle: title,
        domainId,
        domainName,
        topicId,
        topicName,
        fieldId: domainId,
        fieldName: domainName,
        subjectId: topicId,
        subjectName: topicName,
        folderId: params?.folderId !== undefined ? params.folderId : current.folderId,
        fileId: params?.fileId !== undefined ? params.fileId : current.fileId,
        calendarEventId:
          params?.calendarEventId !== undefined
            ? params.calendarEventId
            : current.calendarEventId,
        resourceMeta: params?.resourceMeta ?? current.resourceMeta,
        notes: params?.notes ?? current.notes,
        startTime,
        targetDurationSeconds,
        breakDurationSeconds,
        pauseIntervals,
        focusIntervals,
        breakIntervals,
        currentPauseStart: null,
        breakStartTime: null,
        elapsedSeconds: times.elapsedSeconds,
        remainingSeconds: times.remainingSeconds,
        breakRemainingSeconds: breakDurationSeconds
      };

      set(newState);
      persistActiveSession(newState);
    },

    startSessionFromCalendarBlock: async (block: any) => {
      await get().startSession({
        id: block.id,
        title: block.title,
        domainName: block.domain || block.domainName,
        topicName: block.topic || block.topicName,
        targetMinutes: block.durationMinutes || block.plannedDurationMinutes || 45,
        mode: 'countdown'
      });
    },

    pauseSession: () => {
      const current = get();
      if (current.status !== 'running') return;
      const now = Date.now();
      const pauseIntervals = [...current.pauseIntervals, { pausedAt: now, resumedAt: null }];

      const newState = {
        status: 'paused' as const,
        pauseIntervals,
        currentPauseStart: now
      };
      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    resumeSession: () => {
      const current = get();
      if (current.status !== 'paused') return;
      const now = Date.now();
      const pauseIntervals = current.pauseIntervals.map((interval) =>
        interval.resumedAt === null ? { ...interval, resumedAt: now } : interval
      );

      const newState = {
        status: 'running' as const,
        pauseIntervals,
        currentPauseStart: null
      };
      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    takeBreak: (minutes?: number) => {
      const current = get();
      const breakDuration = minutes ? minutes * 60 : current.breakDurationSeconds;
      const now = Date.now();

      const updatedFocus = [...current.focusIntervals];
      if (updatedFocus.length > 0 && updatedFocus[updatedFocus.length - 1].endedAt === null) {
        updatedFocus[updatedFocus.length - 1].endedAt = now;
      }

      const updatedBreaks = [...current.breakIntervals, { startedAt: now, endedAt: null }];

      const newState = {
        status: 'break_running' as const,
        phase: 'break' as const,
        breakDurationSeconds: breakDuration,
        breakStartTime: now,
        breakRemainingSeconds: breakDuration,
        focusIntervals: updatedFocus,
        breakIntervals: updatedBreaks,
        currentPauseStart: null
      };

      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    pauseBreak: () => {
      const current = get();
      if (current.status !== 'break_running') return;
      const newState = {
        status: 'break_paused' as const,
        currentPauseStart: Date.now()
      };
      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    resumeBreak: () => {
      const current = get();
      if (current.status !== 'break_paused') return;
      const newState = {
        status: 'break_running' as const,
        currentPauseStart: null
      };
      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    resumeFocus: () => {
      const current = get();
      const now = Date.now();

      const updatedBreaks = [...current.breakIntervals];
      if (updatedBreaks.length > 0 && updatedBreaks[updatedBreaks.length - 1].endedAt === null) {
        updatedBreaks[updatedBreaks.length - 1].endedAt = now;
      }

      const updatedFocus = [...current.focusIntervals, { startedAt: now, endedAt: null }];

      const newState = {
        status: 'running' as const,
        phase: 'focus' as const,
        focusIntervals: updatedFocus,
        breakIntervals: updatedBreaks,
        breakStartTime: null,
        currentPauseStart: null
      };

      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    continueFocus: () => {
      const current = get();
      const now = Date.now();
      const updatedFocus = [...current.focusIntervals, { startedAt: now, endedAt: null }];

      const newState = {
        status: 'running' as const,
        phase: 'focus' as const,
        mode: 'stopwatch' as const,
        focusIntervals: updatedFocus,
        currentPauseStart: null
      };

      set(newState);
      persistActiveSession({ ...current, ...newState });
    },

    finishSession: async () => {
      const current = get();
      if (!current.startTime || current.status === 'idle') return null;

      const effectiveNow = current.currentPauseStart ?? Date.now();

      const finalFocus = [...current.focusIntervals];
      if (finalFocus.length > 0 && finalFocus[finalFocus.length - 1].endedAt === null) {
        finalFocus[finalFocus.length - 1].endedAt = effectiveNow;
      }

      const finalBreaks = [...current.breakIntervals];
      if (finalBreaks.length > 0 && finalBreaks[finalBreaks.length - 1].endedAt === null) {
        finalBreaks[finalBreaks.length - 1].endedAt = effectiveNow;
      }

      let actualFocusMs = 0;
      for (const f of finalFocus) {
        const end = f.endedAt ?? effectiveNow;
        actualFocusMs += Math.max(0, end - f.startedAt);
      }

      let actualBreakMs = 0;
      for (const b of finalBreaks) {
        const end = b.endedAt ?? effectiveNow;
        actualBreakMs += Math.max(0, end - b.startedAt);
      }

      const actualFocusSeconds = Math.max(1, Math.floor(actualFocusMs / 1000));
      const actualBreakSeconds = Math.floor(actualBreakMs / 1000);
      const durationSeconds = actualFocusSeconds + actualBreakSeconds;
      const durationMinutes = Math.max(1, Math.round(actualFocusSeconds / 60));

      let completedSession: any = null;

      if (current.activeSessionId) {
        try {
          const completeRes = await fetch(
            `/api/study-sessions/${current.activeSessionId}/complete`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actualFocusSeconds,
                actualBreakSeconds,
                actualEndTimestamp: effectiveNow,
                pauseIntervals: current.pauseIntervals,
                notes: current.notes
              })
            }
          );
          if (completeRes.ok) {
            completedSession = await completeRes.json();
          }
        } catch (err) {
          console.warn('Failed to complete session on API:', err);
        }
      }

      const newSession: TrackingSession = completedSession || {
        id: current.activeSessionId || generateUuidV7(),
        userId: 'default-user',
        title: current.sessionTitle || 'Deep Work: Focus Session',
        mode: current.mode,
        timerMode: current.mode,
        status: 'completed',
        source: 'timer_adhoc',
        date: getTodayDateString(),
        startTime: current.startTime,
        endTime: effectiveNow,
        actualStartTimestamp: current.startTime,
        actualEndTimestamp: effectiveNow,
        pauseIntervals: current.pauseIntervals,
        focusIntervals: finalFocus,
        breakIntervals: finalBreaks,
        actualFocusSeconds,
        actualBreakSeconds,
        durationSeconds,
        durationMinutes,
        plannedDurationMinutes: Math.round(current.targetDurationSeconds / 60),
        domainId: current.domainId ?? current.fieldId,
        domainName: current.domainName ?? current.fieldName ?? 'General',
        topicId: current.topicId ?? current.subjectId,
        topicName: current.topicName ?? current.subjectName,
        fieldId: current.domainId ?? current.fieldId,
        fieldName: current.domainName ?? current.fieldName,
        subjectId: current.topicId ?? current.subjectId,
        subjectName: current.topicName ?? current.subjectName,
        folderId: current.folderId,
        fileId: current.fileId,
        calendarEventId: current.calendarEventId,
        notes: current.notes,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const resetState = {
        activeSessionId: null,
        status: 'idle' as const,
        phase: 'focus' as const,
        startTime: null,
        pauseIntervals: [],
        focusIntervals: [],
        breakIntervals: [],
        currentPauseStart: null,
        breakStartTime: null,
        elapsedSeconds: 0,
        remainingSeconds: current.targetDurationSeconds,
        endSummaryModalOpen: true,
        summarySession: newSession
      };
      set(resetState);
      persistActiveSession({ ...current, ...resetState });

      await saveTrackingSession(newSession);
      await get().loadTrackingData();

      return newSession;
    },

    saveFinishedSession: async (summaryNotes?: string) => {
      const current = get();
      if (current.summarySession && summaryNotes !== undefined) {
        await updateTrackingSession(current.summarySession.id, {
          notes: summaryNotes.trim()
        });
        await get().loadTrackingData();
      }
      set({ endSummaryModalOpen: false, summarySession: null });
      return current.summarySession;
    },

    discardSession: async () => {
      const current = get();
      await get().abortSession();
      const resetState = {
        activeSessionId: null,
        status: 'idle' as const,
        phase: 'focus' as const,
        startTime: null,
        pauseIntervals: [],
        focusIntervals: [],
        breakIntervals: [],
        currentPauseStart: null,
        breakStartTime: null,
        elapsedSeconds: 0,
        remainingSeconds: current.targetDurationSeconds,
        endSummaryModalOpen: false,
        summarySession: null
      };
      set(resetState);
      persistActiveSession({ ...current, ...resetState });
    },

    abortSession: async () => {
      const current = get();
      if (current.activeSessionId) {
        try {
          await fetch(`/api/study-sessions/${current.activeSessionId}/abort`, {
            method: 'POST'
          });
        } catch (err) {
          console.warn('Failed to abort session on backend:', err);
        }
      }
      const resetState = {
        activeSessionId: null,
        status: 'idle' as const,
        phase: 'focus' as const,
        startTime: null,
        pauseIntervals: [],
        focusIntervals: [],
        breakIntervals: [],
        currentPauseStart: null,
        breakStartTime: null,
        elapsedSeconds: 0,
        remainingSeconds: current.targetDurationSeconds
      };
      set(resetState);
      persistActiveSession({ ...current, ...resetState });
      await get().loadTrackingData();
    },

    resetSession: () => {
      const current = get();
      const resetState = {
        activeSessionId: null,
        status: 'idle' as const,
        phase: 'focus' as const,
        startTime: null,
        pauseIntervals: [],
        focusIntervals: [],
        breakIntervals: [],
        currentPauseStart: null,
        breakStartTime: null,
        elapsedSeconds: 0,
        remainingSeconds: current.targetDurationSeconds,
        breakRemainingSeconds: current.breakDurationSeconds
      };
      set(resetState);
      persistActiveSession({ ...current, ...resetState });
    },

    createManualSession: async (params: CreateManualSessionParams) => {
      const [startHour, startMin] = params.startTimeStr.split(':').map(Number);
      const [endHour, endMin] = params.endTimeStr.split(':').map(Number);
      const [year, month, day] = params.dateStr.split('-').map(Number);

      const start = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const end = new Date(year, month - 1, day, endHour, endMin, 0, 0);

      const durationSeconds = Math.max(60, Math.floor((end.getTime() - start.getTime()) / 1000));
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

      const resolvedDomain = params.domainName || params.fieldName || 'General';
      const resolvedTopic = params.topicName || params.subjectName || '';

      const res = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title.trim() || 'Manual Focus Session',
          domainName: resolvedDomain,
          domainId: params.domainId ?? params.fieldId ?? null,
          topicName: resolvedTopic || null,
          status: 'completed',
          source: 'historical_manual',
          date: params.dateStr,
          plannedStartTime: params.startTimeStr,
          plannedEndTime: params.endTimeStr,
          plannedDurationMinutes: durationMinutes,
          actualStartTimestamp: start.getTime(),
          actualEndTimestamp: end.getTime(),
          actualFocusSeconds: durationSeconds,
          actualBreakSeconds: 0,
          timerMode: 'countdown',
          notes: params.notes
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create historical session');
      }

      await get().loadTrackingData();
      set({ manualModalOpen: false });
    },

    setSessionTitle: (title: string) => {
      set({ sessionTitle: title });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    setDomainAndTopic: async (domainId: string | null, domainName: string, topicName?: string) => {
      const targetTopic = topicName ?? get().topicName ?? get().subjectName;
      set({
        domainId,
        domainName,
        topicId: null,
        topicName: targetTopic,
        fieldId: domainId,
        fieldName: domainName,
        subjectId: null,
        subjectName: targetTopic,
        folderId: domainId
      });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
      if (current.summarySession) {
        try {
          await updateTrackingSession(current.summarySession.id, {
            domainId: domainId || undefined,
            domainName: domainName || undefined,
            topicName: targetTopic || undefined,
            fieldId: domainId || undefined,
            fieldName: domainName || undefined,
            subjectName: targetTopic || undefined
          });
          await get().loadTrackingData();
        } catch (err) {
          console.warn('Failed to update summary session domain/topic:', err);
        }
      }
    },

    setFieldAndSubject: async (fieldId: string | null, fieldName: string, subjectName?: string) => {
      return get().setDomainAndTopic(fieldId, fieldName, subjectName);
    },

    setLinkedResource: (folderId: string | null, fileId: string | null, resourceMeta?: string) => {
      set({ folderId, fileId, resourceMeta });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    linkCalendarEvent: (calendarEventId: string | null, title?: string, targetMinutes?: number) => {
      const updates: Partial<TrackingStoreState> = { calendarEventId };
      if (title) updates.sessionTitle = title;
      if (targetMinutes) {
        updates.targetDurationSeconds = targetMinutes * 60;
        updates.remainingSeconds = targetMinutes * 60;
      }
      set(updates);
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    setMode: (mode: TrackingSessionMode) => {
      set({ mode });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    setTargetMinutes: (minutes: number) => {
      const targetDurationSeconds = Math.max(1, minutes) * 60;
      set({ targetDurationSeconds, remainingSeconds: targetDurationSeconds });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    setBreakMinutes: (minutes: number) => {
      const breakDurationSeconds = Math.max(1, minutes) * 60;
      set({ breakDurationSeconds, breakRemainingSeconds: breakDurationSeconds });
      const current = get();
      if (current.status !== 'idle') {
        persistActiveSession(current);
      }
    },

    syncWithPomodoroInterval: (intervalOrFocus: string | number, optionalBreak?: number) => {
      let focusMinutes = 50;
      let breakMinutes = 10;
      if (typeof intervalOrFocus === 'number') {
        focusMinutes = Math.max(1, Math.min(180, Math.round(intervalOrFocus)));
        breakMinutes = Math.max(1, Math.min(60, Math.round(optionalBreak ?? 10)));
      } else if (typeof intervalOrFocus === 'string') {
        const match = intervalOrFocus.match(/(\d+)\s*m?\s*\/\s*(\d+)\s*m?/);
        if (match) {
          focusMinutes = Math.max(1, Math.min(180, parseInt(match[1], 10)));
          breakMinutes = Math.max(1, Math.min(60, parseInt(match[2], 10)));
        } else if (intervalOrFocus === '25m / 5m') {
          focusMinutes = 25;
          breakMinutes = 5;
        } else if (intervalOrFocus === '90m / 15m') {
          focusMinutes = 90;
          breakMinutes = 15;
        }
      }
      const targetDurationSeconds = focusMinutes * 60;
      const breakDurationSeconds = breakMinutes * 60;
      const current = get();

      if (current.status === 'idle') {
        set({
          targetDurationSeconds,
          breakDurationSeconds,
          remainingSeconds: targetDurationSeconds,
          breakRemainingSeconds: breakDurationSeconds
        });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      } else {
        set({
          targetDurationSeconds,
          breakDurationSeconds
        });
      }
    },

    deleteSession: async (id: string) => {
      try {
        await fetch(`/api/study-sessions/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete study session on API:', err);
      }
      await deleteTrackingSession(id);
      await get().loadTrackingData();
      set({ deleteModalSessionId: null, detailsModalSession: null });
    },

    reorderTodaySessions: async (orderedIds: string[]) => {
      const current = get().todaySessions;
      const sessionMap = new Map(current.map((s) => [s.id, s]));
      const reordered: TrackingSession[] = [];
      for (const id of orderedIds) {
        const item = sessionMap.get(id);
        if (item) reordered.push(item);
      }
      set({ todaySessions: reordered });

      try {
        await fetch('/api/study-sessions/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionIds: orderedIds })
        });
      } catch (err) {
        console.warn('Failed to persist session reordering to API:', err);
      }
    },

    updateSession: async (id: string, updates: Partial<TrackingSession>) => {
      try {
        await fetch(`/api/study-sessions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn('Failed to update study session on API:', err);
      }
      await updateTrackingSession(id, updates);
      await get().loadTrackingData();
      set({ editModalSession: null, detailsModalSession: null });
    },

    setActiveView: (activeView) => set({ activeView }),
    setSetupModalOpen: (setupModalOpen) => set({ setupModalOpen }),
    setLinkPlanModalOpen: (linkPlanModalOpen) => set({ linkPlanModalOpen }),
    setEndSummaryModalOpen: (endSummaryModalOpen) => set({ endSummaryModalOpen }),
    setDetailsModalSession: (detailsModalSession) => set({ detailsModalSession }),
    setEditModalSession: (editModalSession) => set({ editModalSession }),
    setManualModalOpen: (manualModalOpen) => set({ manualModalOpen }),
    setDeleteModalSessionId: (deleteModalSessionId) => set({ deleteModalSessionId }),
    setHistoryFilter: (updates) => {
      set((s) => ({
        historyFilter: {
          ...s.historyFilter,
          ...updates,
          domainId:
            updates.domainId ??
            updates.fieldId ??
            s.historyFilter.domainId ??
            s.historyFilter.fieldId ??
            'all',
          fieldId:
            updates.domainId ??
            updates.fieldId ??
            s.historyFilter.domainId ??
            s.historyFilter.fieldId ??
            'all',
          topic:
            updates.topic ??
            updates.subject ??
            s.historyFilter.topic ??
            s.historyFilter.subject ??
            'all',
          subject:
            updates.topic ??
            updates.subject ??
            s.historyFilter.topic ??
            s.historyFilter.subject ??
            'all'
        }
      }));
      get().loadHistoryData();
    },
    setAnalyticsPeriod: (analyticsPeriod) => {
      set({ analyticsPeriod });
      get().loadAnalyticsData();
    },
    setAnalyticsRefDate: (analyticsRefDate) => {
      set({ analyticsRefDate });
      get().loadAnalyticsData();
    },
    setCrossFilter: (crossFilter) => {
      set({ crossFilter });
      get().loadAnalyticsData();
    },

    tick: () => {
      const current = get();
      if (!current.startTime) return;

      if (current.status === 'running') {
        const times = calculateElapsedAndRemaining(
          current.startTime,
          current.pauseIntervals,
          current.currentPauseStart,
          current.targetDurationSeconds,
          current.mode
        );

        // If countdown completed (reached 0)
        if (current.mode === 'countdown' && times.remainingSeconds <= 0) {
          set({
            status: 'completed',
            elapsedSeconds: current.targetDurationSeconds,
            remainingSeconds: 0
          });
          persistActiveSession({ ...current, status: 'completed' });
          return;
        }

        set({
          elapsedSeconds: times.elapsedSeconds,
          remainingSeconds: times.remainingSeconds
        });
      } else if (current.status === 'break_running' && current.breakStartTime) {
        const now = Date.now();
        const breakElapsedMs = Math.max(0, now - current.breakStartTime);
        const breakElapsedSec = Math.floor(breakElapsedMs / 1000);
        const breakRemainingSec = Math.max(0, current.breakDurationSeconds - breakElapsedSec);

        set({
          breakRemainingSeconds: breakRemainingSec
        });
      }
    }
  };
});

// Single wall-clock interval ticker & OS Sleep / Visibility sync
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useTrackingStore.getState();
    if (store.status === 'running' || store.status === 'break_running') {
      store.tick();
    }
  }, 1000);

  const handleWakeOrFocus = () => {
    const store = useTrackingStore.getState();
    if (store.status !== 'idle') {
      store.tick();
    }
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleWakeOrFocus();
    }
  });
  window.addEventListener('focus', handleWakeOrFocus);

  // Cross-tab synchronization
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      const stored = loadStoredSession();
      if (stored) {
        const times = calculateElapsedAndRemaining(
          stored.startTime,
          stored.pauseIntervals,
          stored.currentPauseStart,
          stored.targetDurationSeconds,
          stored.mode
        );
        useTrackingStore.setState({
          activeSessionId: stored.activeSessionId ?? null,
          status: stored.status,
          phase: stored.phase,
          mode: stored.mode,
          sessionTitle: stored.sessionTitle,
          domainId: stored.domainId ?? stored.fieldId ?? null,
          domainName: stored.domainName ?? stored.fieldName ?? 'General',
          topicId: stored.topicId ?? stored.subjectId ?? null,
          topicName: stored.topicName ?? stored.subjectName ?? '',
          startTime: stored.startTime,
          targetDurationSeconds: stored.targetDurationSeconds,
          breakDurationSeconds: stored.breakDurationSeconds,
          pauseIntervals: stored.pauseIntervals,
          currentPauseStart: stored.currentPauseStart,
          elapsedSeconds: times.elapsedSeconds,
          remainingSeconds: times.remainingSeconds
        });
      } else {
        useTrackingStore.setState({
          activeSessionId: null,
          status: 'idle',
          phase: 'focus',
          startTime: null,
          elapsedSeconds: 0
        });
      }
    }
  });
}
