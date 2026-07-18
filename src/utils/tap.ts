import type { DayStatus } from '../types';

export const effectiveStatus = (status: DayStatus | undefined): DayStatus => status ?? 'work';

export const nextOnSingleTap = (status: DayStatus | undefined): DayStatus => {
  const cur = effectiveStatus(status);
  return cur === 'off' || cur === 'paid' ? 'work' : 'off';
};

export const nextOnDoubleTap = (): DayStatus => 'paid';
