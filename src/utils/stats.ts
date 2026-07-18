import type { DataStore } from '../types';
import { dateKey, listDaysInPeriod } from './period';

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
