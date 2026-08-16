import { addDays, addMonths, format, isSameDay, parseISO } from 'date-fns';

export const PERIOD_START_DAY = 16;

// 夜勤明けの朝に前夜分の運収を入力する運用のため、日付の切り替わりを
// 深夜0時ではなく正午にしている（正午より前は前日のまま扱う）。
export const BUSINESS_DAY_CUTOFF_HOUR = 12;

/** 「今日」を業務日ベースで返す（正午より前は前日）。 */
export const appToday = (now: Date = new Date()): Date => {
  const base = now.getHours() < BUSINESS_DAY_CUTOFF_HOUR ? addDays(now, -1) : now;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
};

export const dateKey = (d: Date): string => format(d, 'yyyy-MM-dd');
export const parseKey = (k: string): Date => parseISO(k);

/** The period key is the yyyy-MM of the period's start month (16th). */
export const periodStart = (date: Date): Date => {
  const day = date.getDate();
  const base = day >= PERIOD_START_DAY ? date : addMonths(date, -1);
  return new Date(base.getFullYear(), base.getMonth(), PERIOD_START_DAY);
};

export const periodEnd = (start: Date): Date => addDays(addMonths(start, 1), -1);

export const periodKey = (date: Date): string => format(periodStart(date), 'yyyy-MM');

export const periodFromKey = (key: string): { start: Date; end: Date } => {
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, m - 1, PERIOD_START_DAY);
  return { start, end: periodEnd(start) };
};

export const periodLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${y}年${m}月`;
};

export const shiftPeriodKey = (key: string, delta: number): string => {
  const { start } = periodFromKey(key);
  const shifted = addMonths(start, delta);
  return format(shifted, 'yyyy-MM');
};

export const listDaysInPeriod = (key: string): Date[] => {
  const { start, end } = periodFromKey(key);
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
};

export const isToday = (d: Date): boolean => isSameDay(d, appToday());

export const listRecentPeriodKeys = (count: number, fromKey?: string): string[] => {
  const base = fromKey ?? periodKey(appToday());
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftPeriodKey(base, -i));
  }
  return keys;
};

export const listPeriodKeysAround = (before: number, after: number, fromKey?: string): string[] => {
  const base = fromKey ?? periodKey(appToday());
  const keys: string[] = [];
  for (let i = -before; i <= after; i++) {
    keys.push(shiftPeriodKey(base, i));
  }
  return keys;
};

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土'];
export const weekdayJa = (d: Date): string => WEEKDAY_JA[d.getDay()];
