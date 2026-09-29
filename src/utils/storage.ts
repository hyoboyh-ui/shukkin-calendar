import type { DataStore, DayRecord } from '../types';

const STORAGE_KEY = 'shukkin-calendar:data:v1';
const PENDING_KEY = 'shukkin-calendar:pending:v1';
const TOKEN_KEY = 'shukkin-calendar:token:v1';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['work', 'off', 'paid'];

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const parseRecord = (raw: unknown): DayRecord | null => {
  if (!isPlainObject(raw)) return null;
  const rec: DayRecord = {};
  if (raw.status !== undefined) {
    if (typeof raw.status !== 'string' || !STATUSES.includes(raw.status)) return null;
    rec.status = raw.status as DayRecord['status'];
  }
  if (raw.revenue !== undefined) {
    if (typeof raw.revenue !== 'number' || !Number.isFinite(raw.revenue) || raw.revenue < 0) return null;
    rec.revenue = raw.revenue;
  }
  if (raw.updatedAt !== undefined) {
    if (typeof raw.updatedAt !== 'number' || !Number.isFinite(raw.updatedAt)) return null;
    rec.updatedAt = raw.updatedAt;
  }
  return rec;
};

/**
 * 記録として正しい形かを確かめる。strict のときは1件でもおかしければ null
 * （バックアップの読み込み用）、そうでなければおかしい日だけ捨てる
 * （保存済みデータやサーバーの応答用。1日の不備で全部を失わないため）。
 */
export const parseDataStore = (value: unknown, strict: boolean): DataStore | null => {
  if (!isPlainObject(value)) return strict ? null : {};
  const out: DataStore = {};
  for (const [key, raw] of Object.entries(value)) {
    const rec = DATE_KEY_RE.test(key) ? parseRecord(raw) : null;
    if (rec) out[key] = rec;
    else if (strict) return null;
  }
  return out;
};

const loadStore = (storageKey: string): DataStore => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (parseDataStore(JSON.parse(raw), false) ?? {}) : {};
  } catch {
    return {};
  }
};

export const loadData = (): DataStore => loadStore(STORAGE_KEY);

export const saveData = (data: DataStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportDataToFile = (data: DataStore): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `shukkin-calendar-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** まだサーバーに送れていない変更のキュー（日付キー→その時点のレコード全体）。 */
export const loadPending = (): DataStore => loadStore(PENDING_KEY);

export const savePending = (pending: DataStore): void => {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
};

export const loadToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveToken = (token: string | null): void => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const importDataFromFile = (file: File): Promise<DataStore> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseDataStore(JSON.parse(String(reader.result)), true);
        if (parsed) resolve(parsed);
        else reject(new Error('invalid backup'));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
