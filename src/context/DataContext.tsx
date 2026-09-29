import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DataStore, DayStatus } from '../types';
import { loadData, loadPending, loadToken, saveData, savePending, saveToken } from '../utils/storage';
import { AuthError, gasLogin, gasSync, isSyncConfigured } from '../utils/sync';

const SYNC_DEBOUNCE_MS = 1500;

interface DataContextValue {
  records: DataStore;
  setStatus: (key: string, status: DayStatus | undefined) => void;
  setRevenue: (key: string, revenue: number | undefined) => void;
  restoreBackup: (data: DataStore) => void;
  syncEnabled: boolean;
  loggedIn: boolean;
  login: (password: string) => Promise<void>;
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
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const recordsRef = useRef(records);
  const pendingRef = useRef(pending);
  const tokenRef = useRef(token);
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
    saveToken(token);
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    syncingRef.current = syncing;
  }, [syncing]);

  const syncNow = useCallback(() => {
    const currentToken = tokenRef.current;
    if (!isSyncConfigured() || !currentToken || syncingRef.current) return;
    const snapshot = pendingRef.current;

    syncingRef.current = true;
    setSyncing(true);
    gasSync(snapshot, currentToken)
      .then((serverRecords) => {
        setRecords((prev) => {
          const next = { ...prev };
          Object.entries(serverRecords).forEach(([date, serverRec]) => {
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
        // ログイン切れのときはトークンを捨てる。未同期の変更はキューに残るので、
        // ログインし直せばそのまま送られる。
        if (err instanceof AuthError) {
          tokenRef.current = null;
          setToken(null);
        }
        setSyncError(err.message);
      })
      .finally(() => {
        syncingRef.current = false;
        setSyncing(false);
      });
  }, []);

  const login = useCallback(
    async (password: string) => {
      const newToken = await gasLogin(password);
      tokenRef.current = newToken;
      setToken(newToken);
      setSyncError(null);
      syncNow();
    },
    [syncNow],
  );

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

  // バックアップの中身を「いま入力した」ことにして全日分を送信キューに入れる。
  // こうしないと次の同期でスプレッドシート側の古いデータに上書きされて戻ってしまう。
  // バックアップに無い日は空の記録として送り、スプレッドシート側からも消す。
  const restoreBackup = useCallback((data: DataStore) => {
    const updatedAt = Date.now();
    const keys = new Set([...Object.keys(recordsRef.current), ...Object.keys(data)]);
    const stamped: DataStore = {};
    keys.forEach((key) => {
      const { status, revenue } = data[key] ?? {};
      stamped[key] = { status, revenue, updatedAt };
    });
    setRecords(stamped);
    setPending((prev) => ({ ...prev, ...stamped }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      records,
      setStatus: (key, status) => stampAndQueue(key, { status }),
      setRevenue: (key, revenue) => stampAndQueue(key, { revenue }),
      restoreBackup,
      syncEnabled: isSyncConfigured(),
      loggedIn: token !== null,
      login,
      pendingCount: Object.keys(pending).length,
      syncing,
      lastSyncedAt,
      syncError,
      syncNow,
    }),
    [records, pending, token, syncing, lastSyncedAt, syncError, syncNow, stampAndQueue, restoreBackup, login],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
