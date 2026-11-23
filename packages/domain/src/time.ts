/**
 * Consolidated Time & Date Utilities for SOS Monorepo
 * Strict validation, timezone-safe calendar day comparisons, and duration calculations.
 */

/**
 * Check if given year, month (1-12), and day (1-31) form a valid calendar date
 * Rejecting impossible dates like Feb 29 on non-leap years, Feb 30/31, April 31, etc.
 */
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Strict European (DD/MM/YYYY) to ISO (YYYY-MM-DD) conversion.
 * Throws or returns fallback if date is impossible or malformed.
 */
export function euroToIso(euroStr: string): string {
  if (!euroStr) return getTodayDateString();
  const trimmed = euroStr.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return getTodayDateString();

  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);

  if (!isValidCalendarDate(y, m, d)) {
    return getTodayDateString();
  }

  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * ISO (YYYY-MM-DD) to European (DD/MM/YYYY) conversion.
 */
export function isoToEuro(isoStr: string): string {
  if (!isoStr) return '01/01/2026';
  const trimmed = isoStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoStr;
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

/**
 * Converts "HH:mm" 24h string to total minutes from start of day (0..1439).
 */
export function timeStringToMinutes(t: string): number {
  if (!t) return 0;
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr || '0', 10) || 0;
  return Math.max(0, Math.min(24 * 60, h * 60 + m));
}

/**
 * Converts total minutes from start of day to "HH:mm" 24h string.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Parses either 12h (e.g. "9:00 AM", "02:30 PM") or 24h ("09:00", "14:30") into 24-hour "HH:mm".
 */
export function parseTimeTo24h(input: string): string {
  if (!input) return '09:00';
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return trimmed;
}

/**
 * Format a 24-hour "HH:mm" string into 12-hour "h:mm A/PM" (e.g. "09:00" -> "9:00 AM", "14:30" -> "2:30 PM").
 */
export function format12HourTime(hhmm: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minFormatted = String(m).padStart(2, '0');
  return `${hour12}:${minFormatted} ${period}`;
}

/**
 * Formats a 24-hour "HH:mm" string into 12-hour with leading zero (e.g. "09:00 AM").
 */
export function formatTime12hWithLeadingZero(hhmm: string): string {
  if (!hhmm) return '09:00 AM';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${m.padStart(2, '0')} ${period}`;
}

/**
 * Format a time range in 12-hour format (e.g. "09:00", "10:30" -> "9:00 AM – 10:30 AM").
 */
export function formatTimeRange12Hour(startHhmm: string, endHhmm: string): string {
  const start = format12HourTime(startHhmm);
  const end = format12HourTime(endHhmm);
  return `${start} – ${end}`;
}

/**
 * Format an integer hour (0..23) for timeline axis (e.g. 0 -> "12 AM", 9 -> "9 AM", 12 -> "12 PM", 13 -> "1 PM").
 */
export function format12HourAxisLabel(hour24: number): string {
  if (hour24 === 0 || hour24 === 24) return '12 AM';
  if (hour24 < 12) return `${hour24} AM`;
  if (hour24 === 12) return '12 PM';
  return `${hour24 - 12} PM`;
}

/**
 * Format duration into colon-separated compound format:
 * e.g. 9900s (165m) -> "2h:45m"
 * e.g. 4200s (70m)  -> "1h:10m"
 * e.g. 3000s (50m)  -> "50m"
 * e.g. 0s           -> "0m"
 */
export function formatCompoundDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const totalMins = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) {
    return `${hours}h:${String(mins).padStart(2, '0')}m`;
  }
  return `${mins}m`;
}

/**
 * Format hours as single decimal or integer:
 * e.g. 16.5 -> "16.5h", 9 -> "9.0h"
 */
export function formatDecimalHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toFixed(1)}h`;
}

/**
 * Format calendar duration from total minutes:
 * e.g. 300 -> "5h", 75 -> "1h:15m", 45 -> "45m"
 */
export function formatCalendarDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h:${String(minutes).padStart(2, '0')}m`;
}

/**
 * Get current system date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if two dates represent the exact same calendar day (matching Year, Month, and Day).
 * Immune to timezone shifts by inspecting year, month, and day components directly.
 */
export function isSameCalendarDay(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined
): boolean {
  if (!a || !b) return false;
  const parseParts = (val: string | Date): [number, number, number] => {
    if (val instanceof Date) {
      return [val.getFullYear(), val.getMonth(), val.getDate()];
    }
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-').map(Number);
      return [y, m - 1, d];
    }
    const d = new Date(val);
    return [d.getFullYear(), d.getMonth(), d.getDate()];
  };
  const [y1, m1, d1] = parseParts(a);
  const [y2, m2, d2] = parseParts(b);
  return y1 === y2 && m1 === m2 && d1 === d2;
}

export type WeekStartDay = 'saturday' | 'monday';

/**
 * Computes week start (start date YYYY-MM-DD) and end (end date YYYY-MM-DD)
 * respecting user-configured weekStartDay ('saturday' or 'monday').
 */
export function getWeekRangeForDate(
  dateStr: string,
  weekStart: WeekStartDay = 'saturday'
): { start: string; end: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat

  let diffToStart = 0;
  if (weekStart === 'saturday') {
    // Saturday = 6. If day is 6 (Sat) -> 0. If day is 0 (Sun) -> 1. If day is 5 (Fri) -> 6.
    diffToStart = (day + 1) % 7;
  } else {
    // Monday = 1. If day is 1 (Mon) -> 0. If day is 0 (Sun) -> 6.
    diffToStart = (day + 6) % 7;
  }

  const startDate = new Date(date);
  startDate.setDate(date.getDate() - diffToStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const format = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  return { start: format(startDate), end: format(endDate) };
}

/**
 * Computes month start (YYYY-MM-01) and end (YYYY-MM-lastDay).
 */
export function getMonthRangeForDate(dateStr: string): { start: string; end: string } {
  const [y, m] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export interface BlockPlacement {
  colIndex: number;
  totalCols: number;
}

/**
 * Computes side-by-side horizontal column placements for overlapping blocks.
 * Overlapping blocks divide the column width evenly:
 * left: calc((colIndex / totalCols) * 100% + 2px)
 * width: calc((1 / totalCols) * 100% - 4px)
 */
export function computeOverlapColumns(
  blocks: { id: string; startTime: string; durationMinutes: number }[]
): Map<string, BlockPlacement> {
  const result = new Map<string, BlockPlacement>();
  if (blocks.length === 0) return result;

  const items = blocks.map((b) => {
    const [h, m] = b.startTime.split(':').map(Number);
    const start = (h || 0) * 60 + (m || 0);
    const end = start + (b.durationMinutes || 30);
    return { id: b.id, start, end };
  });

  // Sort by start time ascending, then longer duration first
  items.sort((a, b) => a.start - b.start || b.end - a.end);

  const clusters: typeof items[] = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.end;
    } else {
      if (item.start < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.end;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  for (const cluster of clusters) {
    const columnEndTimes: number[] = [];
    const assignments: { id: string; colIndex: number }[] = [];

    for (const item of cluster) {
      let placedCol = -1;
      for (let c = 0; c < columnEndTimes.length; c++) {
        if (columnEndTimes[c] <= item.start) {
          placedCol = c;
          columnEndTimes[c] = item.end;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnEndTimes.length;
        columnEndTimes.push(item.end);
      }
      assignments.push({ id: item.id, colIndex: placedCol });
    }

    const totalCols = columnEndTimes.length;
    for (const a of assignments) {
      result.set(a.id, { colIndex: a.colIndex, totalCols });
    }
  }

  return result;
}

