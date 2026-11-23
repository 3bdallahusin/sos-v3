import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  FilterX,
  ArrowLeft
} from 'lucide-react';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { loadLibraryFolders } from '@sos/persistence';
import { formatCompoundDuration, type LibraryFolder, type TrackingSession } from '@sos/domain';
import { SOSCard, CustomSearchableSelect } from '../ui/index.js';
import { humanizeTitle } from '../../utils/formatters.js';

export const SessionHistoryView: React.FC = () => {
  const {
    historySessions,
    historyFilter,
    setHistoryFilter,
    setManualModalOpen,
    setDetailsModalSession,
    setActiveView
  } = useTrackingStore();

  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  useEffect(() => {
    loadLibraryFolders()
      .then((all) => setFolders(all.filter((f) => f.id !== 'library-root')))
      .catch(() => {});
  }, []);

  const formatTimeWindow = (startMs: number, endMs: number): string => {
    const s = new Date(startMs);
    const e = new Date(endMs);
    const fmt = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(s)} - ${fmt(e)}`;
  };

  // Group sessions by calendar day
  const groupedByDay: Array<{
    dateHeading: string;
    sessions: TrackingSession[];
    totalSeconds: number;
  }> = [];

  const dayMap = new Map<string, TrackingSession[]>();
  for (const s of historySessions) {
    if (s.status !== 'completed') continue;
    const startMs = s.actualStartTimestamp
      ? Number(s.actualStartTimestamp)
      : (s.startTime ? new Date(s.startTime).getTime() : (s.date ? new Date(`${s.date}T00:00:00Z`).getTime() : Date.now()));
    const d = new Date(startMs);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    dayMap.get(dateKey)!.push(s);
  }

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const yesterdayStr = (() => {
    const yest = new Date(Date.now() - 86400000);
    return `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
  })();

  const sortedDateKeys = Array.from(dayMap.keys()).sort((a, b) => b.localeCompare(a));
  for (const dateKey of sortedDateKeys) {
    const rawSessions = dayMap.get(dateKey)!;
    const sessions = [...rawSessions].sort((a, b) => {
      const timeA = a.actualStartTimestamp || (a.startTime ? new Date(a.startTime).getTime() : 0);
      const timeB = b.actualStartTimestamp || (b.startTime ? new Date(b.startTime).getTime() : 0);
      return timeB - timeA;
    });

    const firstDate = new Date(sessions[0].startTime || sessions[0].date || Date.now());
    let dayPrefix = firstDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    if (dateKey === todayStr) {
      dayPrefix = `Today — ${dayPrefix}`;
    } else if (dateKey === yesterdayStr) {
      dayPrefix = `Yesterday — ${dayPrefix}`;
    }

    const totalSeconds = sessions.reduce(
      (acc, s) => acc + (s.actualFocusSeconds || s.durationSeconds || ((s.durationMinutes ?? 0) * 60)),
      0
    );

    groupedByDay.push({
      dateHeading: dayPrefix,
      sessions,
      totalSeconds
    });
  }

  // Dynamically compute topics based on selected domain
  const activeDomainId = historyFilter.domainId || historyFilter.fieldId;
  const relevantSessions =
    activeDomainId && activeDomainId !== 'all'
      ? historySessions.filter(
          (s) =>
            s.domainId === activeDomainId ||
            s.fieldId === activeDomainId ||
            s.folderId === activeDomainId ||
            (s.domainName &&
              folders.find((f) => f.id === activeDomainId)?.name.toLowerCase() ===
                s.domainName.toLowerCase()) ||
            (s.fieldName &&
              folders.find((f) => f.id === activeDomainId)?.name.toLowerCase() ===
                s.fieldName.toLowerCase())
        )
      : historySessions;

  const topicSet = new Set<string>();
  for (const s of relevantSessions) {
    const sub = s.topicName || s.subjectName || s.subtitle;
    if (sub && sub.trim().length > 0) {
      topicSet.add(sub.trim());
    }
  }
  const uniqueTopics = Array.from(topicSet).sort();

  return (
    <div
      data-testid="session-history-view"
      className="w-full flex flex-col gap-6"
    >
      {/* Filter Bar & Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {/* 1. Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 pointer-events-none" />
            <input
              data-testid="history-search-input"
              type="text"
              value={historyFilter.search}
              onChange={(e) => setHistoryFilter({ search: e.target.value })}
              placeholder="Search sessions..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#111113] border border-[#1E1E22] text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#323238] transition-colors"
            />
          </div>

        {/* 2. Domain Dropdown */}
        <CustomSearchableSelect
          dataTestId="history-field-select"
          value={historyFilter.domainId || historyFilter.fieldId || 'all'}
          onChange={(val) => {
            setHistoryFilter({ domainId: val, fieldId: val, topic: 'all', subject: 'all' });
          }}
          options={[
            { value: 'all', label: 'All Domains' },
            ...folders.map((f) => ({ value: f.id, label: f.name }))
          ]}
          placeholder="All Domains"
        />

        {/* 3. Topic Dropdown */}
        <CustomSearchableSelect
          dataTestId="history-subject-select"
          value={historyFilter.topic || historyFilter.subject || 'all'}
          onChange={(val) => setHistoryFilter({ topic: val, subject: val })}
          options={[
            { value: 'all', label: 'All Topics' },
            ...uniqueTopics.map((sub) => ({ value: sub, label: sub }))
          ]}
          placeholder="All Topics"
        />

        {/* 4. Date Range Dropdown */}
        <CustomSearchableSelect
          dataTestId="history-date-select"
          value={historyFilter.dateRange || 'all'}
          onChange={(val) =>
            setHistoryFilter({
              dateRange: val as 'this_week' | 'last_week' | 'this_month' | 'all'
            })
          }
          options={[
            { value: 'all', label: 'All Time' },
            { value: 'this_week', label: 'This Week' },
            { value: 'last_week', label: 'Last Week' },
            { value: 'this_month', label: 'This Month' }
          ]}
          placeholder="All Time"
        />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="add-manual-session-btn"
            onClick={() => setManualModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-[#EDEDED] text-[#09090B] font-medium text-xs hover:bg-white transition-all duration-150 ease-out inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0 font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Add Historical Session</span>
          </button>
        </div>
      </div>

      {/* History Sessions List */}
      <div className="flex flex-col gap-6">
        {groupedByDay.length === 0 ? (
          /* Filtered Empty State (TRACK-11) */
          <SOSCard
            data-testid="history-empty-state"
            className="py-16 px-4 shadow-sm"
            innerClassName="text-center flex flex-col items-center justify-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-[#161619] border border-[#242428] flex items-center justify-center text-[#71717A]">
              <FilterX className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <span className="text-xs font-semibold text-[#FAFAFA]">No sessions found</span>
              <span className="text-[11px] text-[#71717A]">
                There are no focus or study records matching your current filter criteria.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setHistoryFilter({ search: '', fieldId: 'all', dateRange: 'all' })
              }
              className="mt-1 px-3 py-1.5 rounded-lg bg-[#161619] hover:bg-[#1E1E22] border border-[#242428] text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </SOSCard>
        ) : (
          groupedByDay.map((group) => (
            <div key={group.dateHeading} className="flex flex-col gap-2">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="font-semibold text-[#FAFAFA]">{group.dateHeading}</span>
                <span className="text-[11px] font-mono text-[#71717A]">
                  {group.sessions.length}{' '}
                  {group.sessions.length === 1 ? 'Session' : 'Sessions'} •{' '}
                  {formatCompoundDuration(group.totalSeconds)}
                </span>
              </div>

              {/* Day Sessions */}
              <div className="flex flex-col gap-2">
                {group.sessions.map((session) => {
                  const isManual = session.source === 'historical_manual' || session.isManual;
                  const badgeLabel = isManual ? 'Historical' : session.source === 'calendar' ? 'Calendar' : 'Focus Timer';
                  const durationSec: number =
                    session.actualFocusSeconds ||
                    session.durationSeconds ||
                    ((session.durationMinutes || session.plannedDurationMinutes || 0) * 60);
                  const durationStr = formatCompoundDuration(durationSec);
                  
                  let timeWindow = '';
                  if (session.plannedStartTime && session.plannedEndTime) {
                    timeWindow = `${session.plannedStartTime} - ${session.plannedEndTime}`;
                  } else if (session.actualStartTimestamp && session.actualEndTimestamp) {
                    timeWindow = formatTimeWindow(session.actualStartTimestamp, session.actualEndTimestamp);
                  } else if (session.startTime && session.endTime) {
                    timeWindow = formatTimeWindow(session.startTime, session.endTime);
                  }

                  return (
                    <SOSCard
                      key={session.id}
                      data-testid={`history-item-${session.id}`}
                      onClick={() => setDetailsModalSession(session)}
                      className="p-3.5 shadow-sm cursor-pointer hover:border-white/[0.12] hover:bg-[#18181C] transition-all duration-150"
                      innerClassName="!flex-row items-center justify-between w-full"
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#FAFAFA] group-hover:text-white transition-colors truncate font-sans">
                            {humanizeTitle(session.title)}
                          </span>
                          {isManual && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-white/[0.04] text-[#71717A] border border-white/[0.06] shrink-0">
                              Manual
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#71717A] mt-0.5 truncate font-sans">
                          {session.domainName || session.fieldName || 'Computer Science'}
                          {(session.topicName || session.subtitle || session.subjectName)
                            ? ` • ${session.topicName || session.subtitle || session.subjectName}`
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-[#161619] border border-white/[0.06] rounded-lg px-2.5 py-1 font-mono text-xs text-[#FAFAFA] tabular-nums">
                          {durationStr}
                        </span>
                        {timeWindow && (
                          <span className="bg-[#161619] border border-white/[0.06] rounded-lg px-2.5 py-1 font-mono text-xs text-[#A1A1AA] tabular-nums">
                            {timeWindow}
                          </span>
                        )}
                      </div>
                    </SOSCard>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
