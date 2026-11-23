import { create } from 'zustand';
import {
  type LearningBlock,
  type LearningBlockDomain,
  type CalendarBlocksSummary,
  formatCalendarDuration,
  getTodayDateString,
  getWeekRangeForDate,
  getMonthRangeForDate
} from '@sos/domain';
import { useSettingsStore } from './settings-store.js';

export interface CreateBlockParams {
  title: string;
  domain: string;
  topic?: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrenceRule?: {
    frequency: 'daily' | 'weekly';
    daysOfWeek?: number[];
    endDate?: string;
  };
}

export interface UpdateBlockParams {
  title?: string;
  domain?: string;
  topic?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  scope?: 'single' | 'following';
}

export function getWeekRange(dateStr: string): { start: string; end: string } {
  const weekStart = useSettingsStore.getState().settings.general?.weekStartDay || 'saturday';
  return getWeekRangeForDate(dateStr, weekStart);
}

export function getMonthRange(dateStr: string): { start: string; end: string } {
  return getMonthRangeForDate(dateStr);
}

interface CalendarStoreState {
  blocks: LearningBlock[];
  summary: CalendarBlocksSummary;
  viewMode: 'day' | 'week' | 'month';
  currentDate: string; // YYYY-MM-DD
  selectedBlockId: string | null;
  isModalOpen: boolean;
  editingBlock: LearningBlock | null;
  initialSlot?: { date: string; startTime: string; endTime: string };
  isLoading: boolean;

  // Actions
  loadBlocks: () => Promise<void>;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  setCurrentDate: (date: string) => void;
  navigateRelative: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  selectBlock: (id: string | null) => void;
  openCreateModal: (slot?: { date: string; startTime: string; endTime: string }) => void;
  openEditModal: (block: LearningBlock) => void;
  closeModal: () => void;
  createBlock: (params: CreateBlockParams) => Promise<LearningBlock>;
  updateBlock: (id: string, updates: UpdateBlockParams) => Promise<void>;
  deleteBlock: (id: string, scope?: 'single' | 'following') => Promise<void>;
}

function mapStudySessionToBlock(s: any): LearningBlock {
  return {
    id: s.id,
    title: s.title,
    domain: s.domainName || s.domain,
    topic: s.topicName ?? s.topic ?? undefined,
    date: s.date,
    startTime: s.plannedStartTime || s.startTime || '09:00',
    endTime: s.plannedEndTime || s.endTime || '10:00',
    durationMinutes: Number(s.plannedDurationMinutes || s.durationMinutes || 0),
    status: s.status,
    seriesId: s.seriesId ?? undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  };
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  blocks: [],
  summary: {
    totalMinutes: 0,
    formattedDuration: '0h',
    blockCount: 0
  },
  viewMode: 'day',
  currentDate: getTodayDateString(),
  selectedBlockId: null,
  isModalOpen: false,
  editingBlock: null,
  initialSlot: undefined,
  isLoading: true,

  loadBlocks: async () => {
    try {
      set({ isLoading: true });
      const { currentDate, viewMode } = get();

      // Fetch broad range covering month around current date
      const { start: monthStart, end: monthEnd } = getMonthRange(currentDate);

      const res = await fetch(`/api/study-sessions?start=${monthStart}&end=${monthEnd}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch study sessions: ${res.statusText}`);
      }
      const data = await res.json();
      const rawSessions = data.sessions || [];
      const allBlocks: LearningBlock[] = rawSessions.map(mapStudySessionToBlock);

      // Compute view-specific summary
      let activeBlocks = allBlocks;
      if (viewMode === 'day') {
        activeBlocks = allBlocks.filter((b) => b.date === currentDate);
      } else if (viewMode === 'week') {
        const { start, end } = getWeekRange(currentDate);
        activeBlocks = allBlocks.filter((b) => b.date >= start && b.date <= end);
      } else {
        const { start, end } = getMonthRange(currentDate);
        activeBlocks = allBlocks.filter((b) => b.date >= start && b.date <= end);
      }

      const totalMinutes = activeBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
      const formattedDuration = formatCalendarDuration(totalMinutes);
      const summary: CalendarBlocksSummary = {
        totalMinutes,
        formattedDuration,
        blockCount: activeBlocks.length
      };

      set({
        blocks: allBlocks,
        summary,
        isLoading: false
      });
    } catch (err) {
      console.warn('Error loading calendar blocks from API:', err);
      set({ isLoading: false });
    }
  },

  setViewMode: (viewMode: 'day' | 'week' | 'month') => {
    set({ viewMode });
    const { blocks, currentDate } = get();
    let activeBlocks = blocks;
    if (viewMode === 'day') {
      activeBlocks = blocks.filter((b) => b.date === currentDate);
    } else if (viewMode === 'week') {
      const { start, end } = getWeekRange(currentDate);
      activeBlocks = blocks.filter((b) => b.date >= start && b.date <= end);
    } else {
      const { start, end } = getMonthRange(currentDate);
      activeBlocks = blocks.filter((b) => b.date >= start && b.date <= end);
    }
    const totalMinutes = activeBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
    const summary: CalendarBlocksSummary = {
      totalMinutes,
      formattedDuration: formatCalendarDuration(totalMinutes),
      blockCount: activeBlocks.length
    };
    set({ summary });
  },

  setCurrentDate: (currentDate: string) => {
    set({ currentDate });
    get().loadBlocks();
  },

  navigateRelative: (direction: 'prev' | 'next') => {
    const { currentDate, viewMode } = get();
    const [y, m, d] = currentDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (viewMode === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      date.setDate(1);
      date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    }

    const nextStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    set({ currentDate: nextStr });
    get().loadBlocks();
  },

  goToToday: () => {
    set({ currentDate: getTodayDateString(), selectedBlockId: null });
    get().loadBlocks();
  },

  selectBlock: (selectedBlockId: string | null) => set({ selectedBlockId }),

  openCreateModal: (slot?: { date: string; startTime: string; endTime: string }) => {
    set({
      isModalOpen: true,
      editingBlock: null,
      initialSlot: slot
    });
  },

  openEditModal: (block: LearningBlock) => {
    set({
      isModalOpen: true,
      editingBlock: block,
      initialSlot: undefined
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      editingBlock: null,
      initialSlot: undefined
    });
  },

  createBlock: async (params: CreateBlockParams) => {
    const res = await fetch('/api/study-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        domainName: params.domain,
        topicName: params.topic || null,
        date: params.date,
        plannedStartTime: params.startTime,
        plannedEndTime: params.endTime,
        source: 'calendar',
        status: 'planned',
        recurrenceRule: params.recurrenceRule
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create block: ${res.statusText}`);
    }

    const created = await res.json();
    const newBlock = mapStudySessionToBlock(created);

    await get().loadBlocks();
    set({ selectedBlockId: newBlock.id, isModalOpen: false });
    return newBlock;
  },

  updateBlock: async (id: string, updates: UpdateBlockParams) => {
    const res = await fetch(`/api/study-sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updates.title,
        domainName: updates.domain,
        topicName: updates.topic,
        date: updates.date,
        plannedStartTime: updates.startTime,
        plannedEndTime: updates.endTime,
        scope: updates.scope || 'single'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update block: ${res.statusText}`);
    }

    await get().loadBlocks();
    set({ isModalOpen: false, editingBlock: null });
  },

  deleteBlock: async (id: string, scope: 'single' | 'following' = 'single') => {
    const res = await fetch(`/api/study-sessions/${id}?scope=${scope}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`Failed to delete learning block: ${res.statusText}`);
    }

    const { selectedBlockId } = get();
    if (selectedBlockId === id) {
      set({ selectedBlockId: null });
    }
    await get().loadBlocks();
    set({ isModalOpen: false, editingBlock: null });
  }
}));
