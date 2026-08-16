export type DayStatus = 'work' | 'off' | 'paid';

export interface DayRecord {
  status?: DayStatus;
  revenue?: number;
  /** オンライン同期用のLast-Write-Winsタイムスタンプ（ms epoch）。同期未使用時は未設定。 */
  updatedAt?: number;
}

export type DataStore = Record<string, DayRecord>;

export interface Bubble {
  startKey: string;
  endKey: string;
  count: number;
  edge: boolean;
}
