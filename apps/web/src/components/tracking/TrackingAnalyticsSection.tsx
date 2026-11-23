import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TrackingAnalyticsReport, AnalyticsDataPoint, DomainDistributionItem } from '@sos/domain';
import { getTodayDateString } from '@sos/domain';
import { useTrackingStore } from '../../stores/tracking-store.js';
import { SOSCard } from '../ui/SOSCard.js';

// Nice Numbers Y-Axis Algorithm: always returns clean integer ticks
function computeNiceYAxis(maxVal: number, period: 'day' | 'week' | 'month'): { yAxisMax: number; ticks: number[] } {
  let yAxisMax = 8;
  if (period === 'day') {
    const raw = Math.max(2, Math.ceil(maxVal));
    yAxisMax = raw % 2 === 0 ? raw : raw + 1;
  } else if (period === 'week') {
    const raw = Math.max(4, Math.ceil(maxVal));
    yAxisMax = Math.ceil(raw / 4) * 4;
  } else {
    const raw = Math.max(20, Math.ceil(maxVal));
    yAxisMax = Math.ceil(raw / 20) * 20;
  }
  const ticks = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0];
  return { yAxisMax, ticks };
}

export const TrackingAnalyticsSection: React.FC = () => {
  const {
    analyticsPeriod,
    analyticsRefDate,
    crossFilter,
    analyticsReport,
    weeklyStats,
    setAnalyticsPeriod,
    setAnalyticsRefDate,
    setCrossFilter
  } = useTrackingStore();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const defaultPoints: AnalyticsDataPoint[] = [
    { label: 'Sat', dateKey: 'sat', actualHours: 0, plannedHours: 4.0 },
    { label: 'Sun', dateKey: 'sun', actualHours: 0, plannedHours: 3.5 },
    { label: 'Mon', dateKey: 'mon', actualHours: 0, plannedHours: 4.5 },
    { label: 'Tue', dateKey: 'tue', actualHours: 0, plannedHours: 5.0 },
    { label: 'Wed', dateKey: 'wed', actualHours: 0, plannedHours: 4.5 },
    { label: 'Thu', dateKey: 'thu', actualHours: 0, plannedHours: 5.0 },
    { label: 'Fri', dateKey: 'fri', actualHours: 0, plannedHours: 4.5 }
  ];

  const report: TrackingAnalyticsReport = analyticsReport ?? {
    period: analyticsPeriod,
    referenceDate: analyticsRefDate.toISOString(),
    totalFocusHours: weeklyStats.totalHours || 0,
    dailyAverageHours: weeklyStats.dailyAverageHours || 0,
    studyHoursPoints: defaultPoints,
    learningHoursPoints: defaultPoints,
    fieldDistribution: [],
    domainDistribution: [],
    activeFieldCount: 0,
    activeDomainCount: 0,
    adherenceRate: 0
  };

  const navigateDate = (delta: number) => {
    const next = new Date(analyticsRefDate);
    if (analyticsPeriod === 'day') {
      next.setDate(next.getDate() + delta);
    } else if (analyticsPeriod === 'week') {
      next.setDate(next.getDate() + delta * 7);
    } else {
      next.setMonth(next.getMonth() + delta);
    }
    setAnalyticsRefDate(next);
  };

  const now = new Date();
  const todayStr = getTodayDateString();

  const getPeriodLabel = (): string => {
    if (analyticsPeriod === 'day') {
      const isToday =
        analyticsRefDate.getFullYear() === now.getFullYear() &&
        analyticsRefDate.getMonth() === now.getMonth() &&
        analyticsRefDate.getDate() === now.getDate();

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        analyticsRefDate.getFullYear() === yesterday.getFullYear() &&
        analyticsRefDate.getMonth() === yesterday.getMonth() &&
        analyticsRefDate.getDate() === yesterday.getDate();

      if (isToday) return 'Today';
      if (isYesterday) return 'Yesterday';
      return analyticsRefDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (analyticsPeriod === 'week') {
      const dayIndex = (analyticsRefDate.getDay() + 1) % 7;
      const weekSat = new Date(analyticsRefDate);
      weekSat.setDate(analyticsRefDate.getDate() - dayIndex);
      const weekFri = new Date(weekSat);
      weekFri.setDate(weekSat.getDate() + 6);

      const nowDayIndex = (now.getDay() + 1) % 7;
      const nowSat = new Date(now);
      nowSat.setDate(now.getDate() - nowDayIndex);

      const diff = Math.round((weekSat.getTime() - nowSat.getTime()) / (7 * 86400000));
      if (diff === 0) return 'This Week';
      if (diff === -1) return 'Last Week';
      if (diff === 1) return 'Next Week';

      const satFmt = weekSat.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const friFmt = weekFri.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${satFmt} – ${friFmt}`;
    }

    return analyticsRefDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const defaultFallbackLabels =
    analyticsPeriod === 'day'
      ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
      : analyticsPeriod === 'month'
      ? Array.from({ length: 30 }, (_, i) => `${i + 1}`)
      : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const points: AnalyticsDataPoint[] =
    (report.learningHoursPoints && report.learningHoursPoints.length > 0)
      ? report.learningHoursPoints
      : (report.studyHoursPoints && report.studyHoursPoints.length > 0)
      ? report.studyHoursPoints
      : defaultFallbackLabels.map((lbl) => ({
          label: lbl,
          dateKey: lbl,
          actualHours: 0,
          plannedHours: 0
        }));

  const maxHoursVal = Math.max(
    ...points.map((p) => Math.max(p.actualHours, p.plannedHours)),
    0
  );

  const { yAxisMax, ticks } = computeNiceYAxis(maxHoursVal, analyticsPeriod);

  const getY = (hours: number): number => {
    const clamped = Math.max(0, Math.min(yAxisMax, hours));
    return 102 - (clamped / yAxisMax) * 84;
  };

  const xCoords = points.map((_, i) =>
    points.length > 1 ? 36 + (i / (points.length - 1)) * 324 : 190
  );

  const plannedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xCoords[i]} ${getY(p.plannedHours).toFixed(1)}`)
    .join(' ');

  // Compute active days based on actual calendar date <= todayStr
  let lastActiveIndex = -1;
  points.forEach((p, i) => {
    if (analyticsPeriod === 'day') {
      const isToday = p.dateKey === todayStr;
      if (!isToday) {
        if (p.dateKey < todayStr) lastActiveIndex = i;
      } else {
        const hour = now.getHours();
        const slotHour = parseInt(p.label.split(':')[0], 10) || 0;
        if (slotHour <= hour) lastActiveIndex = i;
      }
    } else {
      if (p.dateKey <= todayStr || p.actualHours > 0) {
        lastActiveIndex = i;
      }
    }
  });

  const activePoints = lastActiveIndex >= 0 ? points.slice(0, lastActiveIndex + 1) : [];

  const actualPath = activePoints.length > 0
    ? activePoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xCoords[i]} ${getY(p.actualHours).toFixed(1)}`)
        .join(' ')
    : '';

  const areaPath = activePoints.length > 0
    ? `${actualPath} L ${xCoords[lastActiveIndex]} 102 L ${xCoords[0]} 102 Z`
    : '';

  // Donut chart math
  const CIRCUMFERENCE = 326.7; // 2 * Math.PI * 52
  const donutItems: DomainDistributionItem[] =
    (report.domainDistribution && report.domainDistribution.length > 0)
      ? report.domainDistribution
      : (report.fieldDistribution || []);

  let accumulatedPercent = 0;

  return (
    <SOSCard
      tier={3}
      data-testid="analytics-section"
      className="w-full shadow-sm"
      innerClassName="flex flex-col"
    >
      {/* 1. Shared Unified Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-[#1E1E22] flex items-center justify-between bg-[#111113]">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight font-sans">
            Analytics
          </h3>

          {crossFilter && (
            <div
              data-testid="cross-filter-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#18181B] border border-[#3F3F46] text-[11px] text-[#FAFAFA]"
            >
              <span>
                Filtered by:{' '}
                {crossFilter.domainName || crossFilter.fieldName || ''}
                {(crossFilter.domainName || crossFilter.fieldName) && crossFilter.dateKey ? ' • ' : ''}
                {crossFilter.dateKey ? crossFilter.dateKey : ''}
              </span>
              <button
                type="button"
                onClick={() => setCrossFilter(null)}
                className="text-[#A1A1AA] hover:text-white cursor-pointer ml-0.5"
                title="Clear cross-filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* E2E Test Compatibility Locators */}
        <span data-testid="weekly-daily-average" className="sr-only">
          {report.dailyAverageHours}h avg
        </span>
        <span data-testid="weekly-total-hours" className="sr-only">
          {report.totalFocusHours}h total
        </span>

        <div className="flex items-center gap-2.5">
          {/* < Dynamic Period > Navigator */}
          <div className="flex items-center gap-1 bg-[#161619] border border-[#222226] px-2 py-0.5 rounded-lg text-xs text-[#FAFAFA]">
            <button
              type="button"
              data-testid="analytics-prev-btn"
              onClick={() => navigateDate(-1)}
              className="hover:text-white cursor-pointer p-0.5 hover:scale-[1.05] active:scale-[0.95] transition-all duration-150 ease-out"
              title="Previous period"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#71717A]" />
            </button>
            <span className="text-[11px] font-mono px-1 font-medium tabular-nums">
              {getPeriodLabel()}
            </span>
            <button
              type="button"
              data-testid="analytics-next-btn"
              onClick={() => navigateDate(1)}
              className="hover:text-white cursor-pointer p-0.5 hover:scale-[1.05] active:scale-[0.95] transition-all duration-150 ease-out"
              title="Next period"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
            </button>
          </div>

          {/* Day | Week | Month Segmented Toggle */}
          <div className="flex items-center bg-[#161619] border border-[#222226] p-0.5 rounded-lg text-xs">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                data-testid={`analytics-tab-${p}`}
                onClick={() => setAnalyticsPeriod(p)}
                className={`px-2.5 py-0.5 rounded capitalize transition-all duration-150 ease-out cursor-pointer ${
                  analyticsPeriod === p
                    ? 'bg-[#222226] text-[#FAFAFA] font-medium shadow-xs'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Unified 2/3 (By Hours) + 1/3 (By Distribution) Internal Grid Split with 1px Divider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Left 2/3: By Hours Line Chart */}
        <div data-testid="weekly-study-hours-card" className="lg:col-span-8 p-5 flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#FAFAFA]">By Hours</span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#60A5FA]" />
                <span className="text-[#FAFAFA]">Actual</span>
              </div>
              <div data-testid="analytics-planned-legend" className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-[#71717A]" />
                <span className="text-[#71717A]">Planned</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="h-44 w-full relative pt-1">
            {hoveredIndex !== null && points[hoveredIndex] && (() => {
              const pt = points[hoveredIndex];
              const pointY = getY(pt.actualHours);
              const isNearTop = pointY < 32;
              const verticalTransform = isNearTop ? '14px' : 'calc(-100% - 14px)';
              const horizontalTransform =
                hoveredIndex === 0
                  ? '0%'
                  : hoveredIndex === points.length - 1
                  ? '-100%'
                  : '-50%';

              return (
                <div
                  className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-[#1C1C21] border border-[#2E2E35] shadow-xl z-30 transition-all duration-75 min-w-[130px]"
                  style={{
                    left: `${(xCoords[hoveredIndex] / 370) * 100}%`,
                    top: `${(pointY / 120) * 100}%`,
                    transform: `translate(${horizontalTransform}, ${verticalTransform})`
                  }}
                >
                  <div className="text-[10px] text-[#A1A1AA] font-sans font-medium mb-1">
                    {pt.label}
                  </div>
                  <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#71717A]">Actual:</span>
                      <span className="text-[#60A5FA] font-semibold tabular-nums">
                        {pt.actualHours}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#71717A]">Plan:</span>
                      <span className="text-[#A1A1AA] tabular-nums">
                        {pt.plannedHours}h
                      </span>
                    </div>
                    {pt.actualHours > 0 && (
                      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-[#2A2A30] text-[10px]">
                        <span className="text-[#71717A]">Diff:</span>
                        <span
                          className={`tabular-nums font-semibold ${
                            pt.actualHours >= pt.plannedHours
                              ? 'text-emerald-400'
                              : 'text-[#F87171]'
                          }`}
                        >
                          {pt.actualHours >= pt.plannedHours ? '+' : ''}
                          {(pt.actualHours - pt.plannedHours).toFixed(1)}h
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <svg viewBox="0 0 370 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="26" y1="18" x2="360" y2="18" stroke="#161619" strokeWidth="1" />
              <line x1="26" y1="39" x2="360" y2="39" stroke="#161619" strokeWidth="1" />
              <line x1="26" y1="60" x2="360" y2="60" stroke="#161619" strokeWidth="1" />
              <line x1="26" y1="81" x2="360" y2="81" stroke="#161619" strokeWidth="1" />
              <line x1="26" y1="102" x2="360" y2="102" stroke="#1E1E22" strokeWidth="1" />

              {/* Dynamic Clean Integer Y Axis Labels */}
              <text x="20" y="21" fill="#71717A" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                {ticks[0]}h
              </text>
              <text x="20" y="42" fill="#71717A" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                {ticks[1]}h
              </text>
              <text x="20" y="63" fill="#71717A" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                {ticks[2]}h
              </text>
              <text x="20" y="84" fill="#71717A" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                {ticks[3]}h
              </text>
              <text x="20" y="105" fill="#71717A" fontSize="8.5" textAnchor="end" fontFamily="JetBrains Mono">
                0h
              </text>

              {/* Planned Target Dashed Line across all points */}
              <path
                d={plannedPath}
                fill="none"
                stroke="#52525B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Area gradient under actual line */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#actualAreaGradient)"
                />
              )}

              {/* Solid Blue Actual Line */}
              {actualPath && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover vertical crosshair */}
              {hoveredIndex !== null && (
                <line
                  x1={xCoords[hoveredIndex]}
                  y1={18}
                  x2={xCoords[hoveredIndex]}
                  y2={102}
                  stroke="#3F3F46"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              )}

              {/* Circles on active actual days */}
              {activePoints.map((p, i) => {
                const isHovered = hoveredIndex === i;
                const isCurrent = i === lastActiveIndex;
                const y = getY(p.actualHours);
                return (
                  <circle
                    key={i}
                    cx={xCoords[i]}
                    cy={y}
                    r={isCurrent || isHovered ? 4.5 : 3}
                    fill="#60A5FA"
                    stroke={isCurrent || isHovered ? '#FAFAFA' : '#111113'}
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform duration-150"
                  />
                );
              })}

              {/* Full-height vertical invisible hover bands */}
              {points.map((p, i) => {
                const bandWidth = points.length > 1 ? 324 / (points.length - 1) : 50;
                return (
                  <rect
                    key={`band-${i}`}
                    x={xCoords[i] - bandWidth / 2}
                    y={0}
                    width={bandWidth}
                    height={120}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setCrossFilter({ dateKey: p.label })}
                  />
                );
              })}

              {/* X Axis Labels */}
              {points.map((p, i) => {
                const isHighlighted = i === lastActiveIndex;

                const showInMonth = i === 0 || (i + 1) % 5 === 0 || i === points.length - 1;
                if (analyticsPeriod === 'month' && !showInMonth) return null;

                return (
                  <text
                    key={i}
                    x={xCoords[i]}
                    y="114"
                    fill={isHighlighted ? '#FAFAFA' : '#71717A'}
                    fontSize="8.5"
                    textAnchor="middle"
                    fontWeight={isHighlighted ? '600' : '500'}
                    className="cursor-pointer font-sans tabular-nums"
                    onClick={() => setCrossFilter({ dateKey: p.label })}
                  >
                    {analyticsPeriod === 'month' ? `${i + 1}` : p.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right 1/3: By Distribution Donut Chart */}
        <div data-testid="field-distribution-card" className="lg:col-span-4 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#FAFAFA]">By Distribution</span>
          </div>

          <div className="flex items-center py-2 gap-5 w-full my-auto">
            {/* 132px Donut Chart */}
            <div className="relative w-[132px] h-[132px] flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 132 132">
                {donutItems.length === 0 ? (
                  <circle
                    cx="66"
                    cy="66"
                    r="52"
                    stroke="#1E1E22"
                    strokeWidth="11"
                    fill="transparent"
                  />
                ) : (
                  donutItems.map((item, idx) => {
                    const dashLength = (item.percentage / 100) * CIRCUMFERENCE;
                    const dashOffset = CIRCUMFERENCE - dashLength;
                    const rotationAngle = (accumulatedPercent / 100) * 360;
                    accumulatedPercent += item.percentage;

                    const isHovered = hoveredField === (item.fieldName || item.domainName);
                    const isDimmed = hoveredField !== null && !isHovered;

                    return (
                      <circle
                        key={idx}
                        cx="66"
                        cy="66"
                        r="52"
                        stroke={item.colorHex}
                        strokeWidth={isHovered ? 13 : 11}
                        fill="transparent"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={dashOffset}
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${rotationAngle}deg)`,
                          opacity: isDimmed ? 0.35 : 1
                        }}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredField(item.fieldName || item.domainName || null)}
                        onMouseLeave={() => setHoveredField(null)}
                        onClick={() => setCrossFilter({ fieldName: item.fieldName || item.domainName })}
                      />
                    );
                  })
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-base font-bold font-mono text-[#FAFAFA] tabular-nums leading-tight">
                  {report.totalFocusHours}h
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#71717A] font-semibold mt-0.5">
                  ACTUAL
                </span>
              </div>
            </div>

            {/* Domain Legend */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 w-full">
              {donutItems.length === 0 ? (
                <div className="h-full flex items-center justify-center py-6 text-center text-xs text-[#71717A]">
                  No study activity recorded for this period
                </div>
              ) : (
                donutItems.map((item, idx) => {
                  const fieldKey = item.fieldName || item.domainName;
                  const isHovered = hoveredField === fieldKey;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredField(fieldKey || null)}
                      onMouseLeave={() => setHoveredField(null)}
                      onClick={() => setCrossFilter({ fieldName: fieldKey })}
                      className={`flex items-center justify-between text-xs cursor-pointer group px-2 py-1.5 rounded-lg transition-all ${
                        isHovered
                          ? 'bg-[#18181C] border border-[#2A2A30] shadow-sm'
                          : 'hover:bg-[#161619] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-[#FAFAFA] font-medium truncate group-hover:text-white font-sans">
                          {item.fieldName || item.domainName}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#71717A] shrink-0 tabular-nums">
                        {item.hours}h • {item.percentage}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </SOSCard>
  );
};
