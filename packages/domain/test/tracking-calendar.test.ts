import { describe, it, expect } from 'vitest';
import {
  type PauseInterval,
  type TrackingSessionMode,
  formatCompoundDuration,
  formatDecimalHours,
  format12HourTime,
  formatTimeRange12Hour,
  format12HourAxisLabel,
  isSameCalendarDay
} from '../src/index.js';

function calculateElapsedAndRemaining(
  startTime: number | null,
  pauseIntervals: PauseInterval[],
  currentPauseStart: number | null,
  targetDurationSeconds: number,
  mode: TrackingSessionMode,
  nowMs: number
): { elapsedSeconds: number; remainingSeconds: number } {
  if (!startTime) {
    return { elapsedSeconds: 0, remainingSeconds: targetDurationSeconds };
  }

  const effectiveNow = currentPauseStart ?? nowMs;
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

describe('Tracking Wall-Clock Drift-Free Math', () => {
  it('calculates exact running elapsed time without interval counter drift', () => {
    const startTime = 1000000;
    const targetSeconds = 25 * 60; // 1500s

    // After 100 seconds
    const { elapsedSeconds, remainingSeconds } = calculateElapsedAndRemaining(
      startTime,
      [],
      null,
      targetSeconds,
      'countdown',
      startTime + 100 * 1000
    );

    expect(elapsedSeconds).toBe(100);
    expect(remainingSeconds).toBe(1400);
  });

  it('accurately accounts for single and multiple pause intervals', () => {
    const startTime = 1000000;
    const targetSeconds = 25 * 60; // 1500s

    // Paused at +60s for 30s (resumed at +90s)
    const pauseIntervals: PauseInterval[] = [
      { pausedAt: startTime + 60 * 1000, resumedAt: startTime + 90 * 1000 }
    ];

    // Current time is +120s from start (120s total wall clock - 30s paused = 90s active)
    const { elapsedSeconds, remainingSeconds } = calculateElapsedAndRemaining(
      startTime,
      pauseIntervals,
      null,
      targetSeconds,
      'countdown',
      startTime + 120 * 1000
    );

    expect(elapsedSeconds).toBe(90);
    expect(remainingSeconds).toBe(1410);
  });

  it('freezes calculation while currently paused', () => {
    const startTime = 1000000;
    const targetSeconds = 25 * 60;

    const currentPauseStart = startTime + 300 * 1000; // paused at 5 mins

    // Even if wall clock now is 1 hour later, elapsed remains frozen at 300s
    const { elapsedSeconds, remainingSeconds } = calculateElapsedAndRemaining(
      startTime,
      [],
      currentPauseStart,
      targetSeconds,
      'countdown',
      startTime + 3600 * 1000
    );

    expect(elapsedSeconds).toBe(300);
    expect(remainingSeconds).toBe(1200);
  });

  it('recalibrates correctly after simulated OS sleep or background tab throttling', () => {
    const startTime = 1000000;
    const targetSeconds = 50 * 60; // 3000s

    // Laptop closes lid for 1200 seconds (20 minutes)
    const sleepAwakeTime = startTime + 1200 * 1000;

    const { elapsedSeconds, remainingSeconds } = calculateElapsedAndRemaining(
      startTime,
      [],
      null,
      targetSeconds,
      'countdown',
      sleepAwakeTime
    );

    // Instant lockstep recalculation with zero tick drift
    expect(elapsedSeconds).toBe(1200);
    expect(remainingSeconds).toBe(1800);
  });

  it('supports open-ended stopwatch count-up mode', () => {
    const startTime = 1000000;

    const { elapsedSeconds, remainingSeconds } = calculateElapsedAndRemaining(
      startTime,
      [],
      null,
      0,
      'stopwatch',
      startTime + 8998 * 1000
    );

    expect(elapsedSeconds).toBe(8998);
    expect(remainingSeconds).toBe(0);
  });

  it('formats compound durations in colon-separated Xh:Ym and Ym formats', () => {
    expect(formatCompoundDuration(9900)).toBe('2h:45m');
    expect(formatCompoundDuration(4200)).toBe('1h:10m');
    expect(formatCompoundDuration(3000)).toBe('50m');
    expect(formatCompoundDuration(1500)).toBe('25m');
    expect(formatCompoundDuration(3600)).toBe('1h:00m');
    expect(formatCompoundDuration(0)).toBe('0m');
    expect(formatCompoundDuration(-10)).toBe('0m');
  });

  it('formats decimal hours cleanly', () => {
    expect(formatDecimalHours(16.5)).toBe('16.5h');
    expect(formatDecimalHours(9)).toBe('9.0h');
    expect(formatDecimalHours(4.12)).toBe('4.1h');
  });

  it('formats 12-hour AM/PM times and timeline axes correctly', () => {
    expect(format12HourTime('09:00')).toBe('9:00 AM');
    expect(format12HourTime('10:30')).toBe('10:30 AM');
    expect(format12HourTime('12:00')).toBe('12:00 PM');
    expect(format12HourTime('13:30')).toBe('1:30 PM');
    expect(format12HourTime('16:30')).toBe('4:30 PM');
    expect(format12HourTime('00:00')).toBe('12:00 AM');

    expect(formatTimeRange12Hour('09:00', '10:30')).toBe('9:00 AM – 10:30 AM');
    expect(formatTimeRange12Hour('14:00', '15:30')).toBe('2:00 PM – 3:30 PM');

    expect(format12HourAxisLabel(0)).toBe('12 AM');
    expect(format12HourAxisLabel(9)).toBe('9 AM');
    expect(format12HourAxisLabel(12)).toBe('12 PM');
    expect(format12HourAxisLabel(13)).toBe('1 PM');
    expect(format12HourAxisLabel(23)).toBe('11 PM');
  });

  it('correctly compares calendar days across years, months and days (isSameCalendarDay)', () => {
    // Same day
    expect(isSameCalendarDay('2026-11-20', '2026-11-20')).toBe(true);
    expect(isSameCalendarDay(new Date(2026, 10, 20), '2026-11-20')).toBe(true);
    
    // Same day number but DIFFERENT months (e.g. Jan 20 vs Nov 20) MUST BE FALSE
    expect(isSameCalendarDay('2027-01-20', '2026-11-20')).toBe(false);
    expect(isSameCalendarDay('2026-12-20', '2026-11-20')).toBe(false);
    
    // Same day number but DIFFERENT years (e.g. Nov 20, 2027 vs Nov 20, 2026) MUST BE FALSE
    expect(isSameCalendarDay('2027-11-20', '2026-11-20')).toBe(false);

    // Null or invalid
    expect(isSameCalendarDay(null, '2026-11-20')).toBe(false);
    expect(isSameCalendarDay(undefined, undefined)).toBe(false);
  });
});
