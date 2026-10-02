import { PersistentPerformanceRecord } from '../types';

export const MAX_WEEKLY_TESTS = 3;

export interface WeeklyQuotaInfo {
  canCreate: boolean;
  testsCreatedThisWeek: number;
  maxWeeklyTests: number;
  remainingTests: number;
  resetsOn: string;
}

export function getWeeklyTestQuota(pastRecords: PersistentPerformanceRecord[]): WeeklyQuotaInfo {
  const now = new Date();
  
  // Calculate start of current week (Monday at 00:00:00)
  const day = now.getDay();
  // In JS getDay(): 0 is Sunday, 1 is Monday... 6 is Saturday
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Calculate next Monday at 00:00:00 (Reset day)
  const nextMonday = new Date(startOfWeek);
  nextMonday.setDate(startOfWeek.getDate() + 7);

  // Count tests created since startOfWeek
  const startMs = startOfWeek.getTime();
  const testsThisWeek = pastRecords.filter((r) => r.timestamp >= startMs).length;

  const remaining = Math.max(0, MAX_WEEKLY_TESTS - testsThisWeek);

  return {
    canCreate: remaining > 0,
    testsCreatedThisWeek: testsThisWeek,
    maxWeeklyTests: MAX_WEEKLY_TESTS,
    remainingTests: remaining,
    resetsOn: nextMonday.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
  };
}
