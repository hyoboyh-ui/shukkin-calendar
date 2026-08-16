import type { DataStore } from '../types';

// デプロイ後に、Apps Script の「ウェブアプリのURL」に置き換える。
export const SYNC_URL = 'https://script.google.com/macros/s/AKfycby3lEuk4oJar_PF5-S6JqWCzoB5V5ObJQuS0rxwCblh1aZMECVVT_lj12OO6xTV0pd4cA/exec';

export const isSyncConfigured = (): boolean => SYNC_URL.length > 0;

interface SyncResponse {
  records: DataStore;
}

/**
 * ローカルの未同期変更をサーバーへ送り、サーバー側でLast-Write-Winsマージした
 * 全レコードを受け取る。Content-Typeを指定しない（text/plain送信）ことで
 * ブラウザのCORSプリフライトを避け、GASのdoPostにそのまま届くようにしている。
 */
export const gasSync = async (changes: DataStore): Promise<SyncResponse> => {
  const res = await fetch(SYNC_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'sync', changes }),
  });

  const text = await res.text();
  const json = JSON.parse(text) as SyncResponse & { error?: string };
  if (json.error) throw new Error(json.error);
  return json;
};
