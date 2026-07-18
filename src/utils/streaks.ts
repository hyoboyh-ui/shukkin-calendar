import type { Bubble, DataStore } from '../types';
import { dateKey } from './period';

const isRest = (store: DataStore, key: string): boolean => {
  const status = store[key]?.status;
  return status === 'off' || status === 'paid';
};

/**
 * Groups consecutive work days (within the given day list) into bubbles.
 * A group is "edge" (dashed/tentative) when it isn't bounded by a rest day
 * on both sides within the visible period.
 */
export const computeBubbles = (days: Date[], store: DataStore): Bubble[] => {
  const bubbles: Bubble[] = [];
  let groupStart: number | null = null;

  for (let i = 0; i <= days.length; i++) {
    const key = i < days.length ? dateKey(days[i]) : null;
    const rest = key === null ? true : isRest(store, key);

    if (!rest && groupStart === null) {
      groupStart = i;
    } else if (rest && groupStart !== null) {
      const groupEnd = i - 1;
      const hasLeadingRest = groupStart > 0;
      const hasTrailingRest = i < days.length;
      bubbles.push({
        startKey: dateKey(days[groupStart]),
        endKey: dateKey(days[groupEnd]),
        count: groupEnd - groupStart + 1,
        edge: !(hasLeadingRest && hasTrailingRest),
      });
      groupStart = null;
    }
  }

  return bubbles;
};

/** Label shown on a day cell inside a work-day bubble, e.g. "4勤中". */
export const currentStreakLabelFor = (bubbles: Bubble[], key: string): string | null => {
  const b = bubbles.find((bub) => keyInRange(bub, key));
  return b ? `${b.count}勤中` : null;
};

const keyInRange = (bubble: Bubble, key: string): boolean =>
  key >= bubble.startKey && key <= bubble.endKey;
