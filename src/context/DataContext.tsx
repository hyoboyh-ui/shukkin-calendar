import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DataStore, DayStatus } from '../types';
import { loadData, loadPending, saveData, savePending } from '../utils/storage';
import { gasSync, isSyncConfigured } from '../utils/sync';

const SYNC_DEBOUNCE_MS = 1500;

interface DataContextValue {
  records: DataStore;
  setStatus: (key: string, status: DayStatus | undefined) => void;
  setRevenue: (key: string, revenue: number | undefined) => void;
  replaceAll: (data: DataStore) => void;
  syncEnabled: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  syncNow: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<DataStore>(() => loadData());
  const [pending, setPending] = useState<DataStore>(() => loadPending());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const recordsRef = useRef(records);
  const pendingRef = useRef(pending);
  const syncingRef = useRef(syncing);
  const debounceTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveData(records);
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    savePending(pending);
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    syncingRef.current = syncing;
  }, [syncing]);

  const syncNow = useCallback(() => {
    if (!isSyncConfigured() || syncingRef.current) return;
    const snapshot = pendingRef.current;

    setSyncing(true);
    gasSync(snapshot)
      .then((res) => {
        setRecords((prev) => {
          const next = { ...prev };
          Object.entries(res.records).forEach(([date, serverRec]) => {
            const localUpdatedAt = next[date]?.updatedAt ?? 0;
            const serverUpdatedAt = serverRec.updatedAt ?? 0;
            if (serverUpdatedAt >= localUpdatedAt) next[date] = serverRec;
          });
          return next;
        });
        setPending((prev) => {
          const next = { ...prev };
          Object.keys(snapshot).forEach((date) => {
            if (next[date]?.updatedAt === snapshot[date].updatedAt) delete next[date];
          });
          return next;
        });
        setLastSyncedAt(Date.now());
        setSyncError(null);
      })
      .catch((err: Error) => {
        setSyncError(err.message);
      })
      .finally(() => {
        setSyncing(false);
      });
  }, []);

  // 起動時に一度、他端末の変更を取り込む
  useEffect(() => {
    syncNow();
  }, [syncNow]);

  // アプリがフォアグラウンドに戻ったタイミングで再同期
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncNow]);

  // 編集のたびに少し待ってから自動同期（連打時の連打防止）
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(syncNow, SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(debounceTimer.current);
  }, [pending, syncNow]);

  const stampAndQueue = useCallback((key: string, patch: Partial<DataStore[string]>) => {
    const updatedAt = Date.now();
    const merged = { ...recordsRef.current[key], ...patch, updatedAt };
    setRecords((prev) => ({ ...prev, [key]: merged }));
    setPending((prev) => ({ ...prev, [key]: merged }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      records,
      setStatus: (key, status) => stampAndQueue(key, { status }),
      setRevenue: (key, revenue) => stampAndQueue(key, { revenue }),
      replaceAll: (data) => setRecords(data),
      syncEnabled: isSyncConfigured(),
      pendingCount: Object.keys(pending).length,
      syncing,
      lastSyncedAt,
      syncError,
      syncNow,
    }),
    [records, pending, syncing, lastSyncedAt, syncError, syncNow, stampAndQueue],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
