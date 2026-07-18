import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DataStore, DayStatus } from '../types';
import { loadData, saveData } from '../utils/storage';

interface DataContextValue {
  records: DataStore;
  setStatus: (key: string, status: DayStatus | undefined) => void;
  setRevenue: (key: string, revenue: number | undefined) => void;
  replaceAll: (data: DataStore) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<DataStore>(() => loadData());

  useEffect(() => {
    saveData(records);
  }, [records]);

  const value = useMemo<DataContextValue>(
    () => ({
      records,
      setStatus: (key, status) =>
        setRecords((prev) => ({
          ...prev,
          [key]: { ...prev[key], status },
        })),
      setRevenue: (key, revenue) =>
        setRecords((prev) => ({
          ...prev,
          [key]: { ...prev[key], revenue },
        })),
      replaceAll: (data) => setRecords(data),
    }),
    [records],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
