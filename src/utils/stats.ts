import type { DataStore } from '../types';
import { dateKey, listDaysInPeriod, parseKey } from './period';

export interface PeriodStats {
  key: string;
  total: number;
  work: number;
  off: number;
  paid: number;
}

export const periodStats = (key: string, records: DataStore): PeriodStats => {
  const days = listDaysInPeriod(key);
  let total = 0;
  let work = 0;
  let off = 0;
  let paid = 0;

  for (const d of days) {
    const rec = records[dateKey(d)];
    total += rec?.revenue ?? 0;
    const status = rec?.status ?? 'work';
    if (status === 'off') off += 1;
    else if (status === 'paid') paid += 1;
    else work += 1;
  }

  return { key, total, work, off, paid };
};

export interface WeekdayStat {
  weekday: number;
  average: number;
  count: number;
}

/**
 * 曜日ごとの平均運収を全履歴から算出する。休日/有給/未入力日は分母から
 * 除外し、実際に運収が入力された日だけで平均を出す。
 */
export const weekdayStats = (records: DataStore): WeekdayStat[] => {
  const sums = Array(7).fill(0);
  const counts = Array(7).fill(0);

  for (const [key, rec] of Object.entries(records)) {
    if (rec.revenue === undefined) continue;
    const weekday = parseKey(key).getDay();
    sums[weekday] += rec.revenue;
    counts[weekday] += 1;
  }

  return sums.map((total, weekday) => ({
    weekday,
    count: counts[weekday],
    average: counts[weekday] > 0 ? total / counts[weekday] : 0,
  }));
};
