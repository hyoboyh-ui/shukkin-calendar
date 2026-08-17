import type { DayStatus } from '../types';

/** シングルタップとダブルタップを区別するための待ち時間(ms)。 */
export const DOUBLE_TAP_WINDOW_MS = 400;

export const effectiveStatus = (status: DayStatus | undefined): DayStatus => status ?? 'work';

export const nextOnSingleTap = (status: DayStatus | undefined): DayStatus => {
  const cur = effectiveStatus(status);
  return cur === 'off' || cur === 'paid' ? 'work' : 'off';
};

export const nextOnDoubleTap = (): DayStatus => 'paid';
