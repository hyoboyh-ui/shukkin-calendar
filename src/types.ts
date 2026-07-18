export type DayStatus = 'work' | 'off' | 'paid';

export interface DayRecord {
  status?: DayStatus;
  revenue?: number;
}

export type DataStore = Record<string, DayRecord>;

export interface Bubble {
  startKey: string;
  endKey: string;
  count: number;
  edge: boolean;
}
