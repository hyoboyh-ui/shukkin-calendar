import type { DataStore } from '../types';

const STORAGE_KEY = 'shukkin-calendar:data:v1';

export const loadData = (): DataStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DataStore) : {};
  } catch {
    return {};
  }
};

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

export const importDataFromFile = (file: File): Promise<DataStore> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DataStore;
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
