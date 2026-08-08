import { describe, it, expect } from 'vitest';
import { computeStreaks, isDueDate } from '../src/services/streak.service';
import { FrequencyConfig } from '@habit/shared';

const daily: FrequencyConfig = { type: 'daily' };
const monWedFri: FrequencyConfig = { type: 'specific_days', days: [1, 3, 5] };
const weekly3: FrequencyConfig = { type: 'weekly', timesPerWeek: 3 };

describe('isDueDate', () => {
  it('daily is due every day', () => {
    expect(isDueDate('2026-08-08', daily)).toBe(true);
    expect(isDueDate('2026-08-09', daily)).toBe(true);
  });

  it('specific_days only on configured weekdays', () => {
    // 2026-08-08 is a Saturday (day 6), 2026-08-10 is Monday (day 1).
    expect(isDueDate('2026-08-10', monWedFri)).toBe(true); // Monday
    expect(isDueDate('2026-08-08', monWedFri)).toBe(false); // Saturday
  });
});

describe('computeStreaks - daily', () => {
  it('returns zero streaks with no completions', () => {
    const result = computeStreaks('2026-08-01', daily, [], '2026-08-08');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
  });

  it('counts a consecutive run as current streak', () => {
    const completed = ['2026-08-06', '2026-08-07', '2026-08-08'];
    const result = computeStreaks('2026-08-01', daily, completed, '2026-08-08');
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('breaks the streak on a missed day', () => {
    const completed = ['2026-08-05', '2026-08-06', '2026-08-08'];
    const result = computeStreaks('2026-08-01', daily, completed, '2026-08-08');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(2);
  });

  it('computes longest streak across gaps', () => {
    const completed = [
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ];
    const result = computeStreaks('2026-08-01', daily, completed, '2026-08-08');
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('handles a streak that ended before today', () => {
    const completed = ['2026-08-01', '2026-08-02', '2026-08-03'];
    const result = computeStreaks('2026-08-01', daily, completed, '2026-08-08');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(3);
  });
});

describe('computeStreaks - specific_days', () => {
  it('skips non-due days without breaking the streak', () => {
    // Mon(10), Wed(12), Fri(14) completed. Today is Sat(15).
    const completed = ['2026-08-10', '2026-08-12', '2026-08-14'];
    const result = computeStreaks('2026-08-01', monWedFri, completed, '2026-08-15');
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('breaks the streak when a due day is missed', () => {
    // Mon(10) done, Wed(12) missed, Fri(14) done.
    const completed = ['2026-08-10', '2026-08-14'];
    const result = computeStreaks('2026-08-01', monWedFri, completed, '2026-08-15');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });
});

describe('computeStreaks - weekly', () => {
  it('counts complete weeks as streak', () => {
    // 3 completions in the current week and 3 in the previous week.
    const completed = [
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
    ];
    const result = computeStreaks('2026-08-01', weekly3, completed, '2026-08-13');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });

  it('does not count an incomplete current week as broken', () => {
    // Previous week complete, current week only 1 completion.
    const completed = ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-10'];
    const result = computeStreaks('2026-08-01', weekly3, completed, '2026-08-13');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });
});
